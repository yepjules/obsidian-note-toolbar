import NoteToolbarPlugin from 'main';
import { ButtonComponent, Menu, MenuItem, Platform, PluginSettingTab, Setting } from 'obsidian';
import { OBSIDIAN_UI_ELEMENTS, OBSIDIAN_UI_MOBILE_NAVBAR_OPTIONS, SETTINGS_VERSION, t } from 'Settings/NoteToolbarSettings';
import { arraymove, getElementPosition } from 'Utils/Utils';
import { displayAppToolbarSettings } from './Sections/AppToolbarSettingsSection';
import { displayCopyAsCalloutSettings } from './Sections/CopyAsCalloutSection';
import { displayRules } from './Sections/DisplayRulesSection';
import { displayFileTypeSettings } from './Sections/FileTypeSettingsSection';
import { displayNavbarSettings } from './Sections/NavbarSettingsSection';
import { displayOtherSettings } from './Sections/OtherSettingsSection';
import { displayToolbarList } from './Sections/ToolbarListSection';
import { SettingsSectionType, SettingsTabState } from './Sections/types';

export default class NoteToolbarSettingTab extends PluginSettingTab {

	private itemListIdCounter: number = 0;

	// track UI state
	private lastScrollPosition: number;
	private lastScrollListenerRegistered = false;
	private isSectionOpen: Record<SettingsSectionType, boolean> = {
		'appToolbars': true,
		'callouts': false,
		'contexts': false,
		'navbar': Platform.isPhone ? true : false,
		'displayRules': true,
		'itemList': true,
	}

	constructor(
		private ntb: NoteToolbarPlugin
	) {
		super(ntb.app, ntb);
	}

	/*************************************************************************
	 * SETTINGS DISPLAY
	 *************************************************************************/

	/**
	 * Displays the main settings.
	 */
	public display(focusSelector?: string, scrollToFocus: boolean = false): void {

		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass('note-toolbar-setting-ui');

		if (this.ntb.settings.version !== SETTINGS_VERSION) {
			new Setting(containerEl)
				.setName(t('setting.error-old-settings-name'))
				.setDesc(t('setting.error-old-settings-description', { oldVersion: this.ntb.settings.version + '', currentVersion: SETTINGS_VERSION + '' }))
				.setClass('note-toolbar-setting-plugin-error')
				.setHeading();
		}

		// update status of installed plugins, for any settings that depend on them
		this.ntb.adapters.checkPlugins();

		// help
		this.ntb.settingsUtils.displayHelpSection(containerEl, undefined, () => this.ntb.app.setting.close());

		// build the shared state object for section modules
		const state = this.buildState();

		// toolbar list
		displayToolbarList(state, containerEl);

		// display rules
		displayRules(state, containerEl);

		displayNavbarSettings(state, containerEl);
		displayAppToolbarSettings(state, containerEl);
		displayFileTypeSettings(state, containerEl);

		// other global settings
		displayCopyAsCalloutSettings(state, containerEl);
		displayOtherSettings(state, containerEl);

		// scroll + focus view
		this.displayFocusScroll(focusSelector, scrollToFocus);

		// show the What's New view once, if the user hasn't seen it yet
		this.ntb.settingsUtils.showWhatsNewIfNeeded();

	}

	/**
	 * Builds the shared state object that section modules use to interact with the coordinator.
	 */
	private buildState(): SettingsTabState {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this;
		return {
			ntb: this.ntb,
			app: this.app,
			containerEl: this.containerEl,
			settingTab: this,
			isSectionOpen: this.isSectionOpen,
			get itemListIdCounter() { return self.itemListIdCounter; },
			set itemListIdCounter(v: number) { self.itemListIdCounter = v; },
			refresh: (focusSelector?: string, scrollToFocus?: boolean) => this.display(focusSelector, scrollToFocus),
			renderSettingToggle: (setting, containerSelector, section, callback) =>
				this.renderSettingToggle(setting, containerSelector, section, callback),
			handleSettingToggle: (containerSelector, section, callback) =>
				this.handleSettingToggle(containerSelector, section, callback),
			listMoveHandler: (keyEvent, index, action) =>
				this.listMoveHandler(keyEvent, index, action),
			listMoveHandlerById: (keyEvent, rowId, action) =>
				this.listMoveHandlerById(keyEvent, rowId, action),
			getNavbarVisibilityMenu: (button) =>
				this.getNavbarVisibilityMenu(button),
			updateNavbarVisibilityButton: (button) =>
				this.updateNavbarVisibilityButton(button),
		};
	}

	/**
	 * Scrolls and optionally focusses on the given selector; otherwise scrolls to the previous view position.
	 */
	displayFocusScroll(focusSelector: string | undefined, scrollToFocus: boolean): void {

		if (Platform.isDesktop && (this.lastScrollPosition === undefined) && !focusSelector && (this.ntb.settings.toolbars.length > 4)) {
			focusSelector = '#tbar-search input';
		}

		if (focusSelector) {
			requestAnimationFrame(() => {
				const focusEl = this.containerEl.querySelector(focusSelector) as HTMLElement;
				focusEl?.focus();
				if (scrollToFocus) {
					setTimeout(() => {
						focusEl?.scrollIntoView({ behavior: 'instant', block: 'center' });
					}, Platform.isMobile ? 100 : 0);
				}
			});
		}
		else if (this.lastScrollPosition != null && this.lastScrollPosition > 0) {
			const targetPosition = this.lastScrollPosition;
			requestAnimationFrame(() => {
				this.containerEl.scrollTo({ top: targetPosition, behavior: "auto" });
			});
		}

		if (!this.lastScrollListenerRegistered) {
			this.ntb.registerDomEvent(this.containerEl, 'scroll', () => {
				this.lastScrollPosition = this.containerEl.scrollTop;
			});
			this.lastScrollListenerRegistered = true;
		}

	}

	/*************************************************************************
	 * SHARED UTILITIES (used by section modules via SettingsTabState)
	 *************************************************************************/

	renderSettingToggle(
		setting: Setting,
		containerSelector: string,
		section: SettingsSectionType,
		callback?: () => void
	): void {
		this.ntb.registerDomEvent(setting.infoEl, 'click', (event) => {
			if (!(event.target instanceof HTMLElement &&
				event.target.matches('a.note-toolbar-setting-focussable-link'))) {
				this.handleSettingToggle(containerSelector, section, callback);
			}
		});
		setting.addExtraButton((cb) => {
			cb.setIcon('right-triangle')
				.setTooltip(t('setting.button-expand-collapse-tooltip'))
				.onClick(async () => {
					this.handleSettingToggle(containerSelector, section, callback);
				});
			cb.extraSettingsEl.addClass('note-toolbar-setting-item-expand');
			this.ntb.settingsUtils.handleKeyClick(cb.extraSettingsEl);
		});
	}

	handleSettingToggle(containerSelector: string, section: SettingsSectionType, callback?: () => void): void {
		const itemsContainer = this.containerEl.querySelector(containerSelector);
		if (itemsContainer) {
			this.isSectionOpen[section] = !this.isSectionOpen[section];
			itemsContainer.setAttribute('data-active', this.isSectionOpen[section].toString());
			callback?.();
		}
	}

	async listMoveHandler(keyEvent: KeyboardEvent | null, index: number, action?: 'up' | 'down' | 'delete'): Promise<void> {
		if (keyEvent) {
			switch (keyEvent.key) {
				case 'ArrowUp':
					keyEvent.preventDefault();
					action = 'up';
					break;
				case 'ArrowDown':
					keyEvent.preventDefault();
					action = 'down';
					break;
				case 'Delete':
				case 'Backspace':
					keyEvent.preventDefault();
					action = 'delete';
					break;
				case 'Enter':
				case ' ':
					keyEvent.preventDefault();
					break;
				default:
					return;
			}
		}
		switch (action) {
			case 'up':
				arraymove(this.ntb.settings.folderMappings, index, index - 1);
				break;
			case 'down':
				arraymove(this.ntb.settings.folderMappings, index, index + 1);
				keyEvent?.preventDefault();
				break;
			case 'delete':
				this.ntb.settings.folderMappings.splice(index, 1);
				keyEvent?.preventDefault();
				break;
		}
		await this.ntb.settingsManager.save();
		this.display();
	}

	async listMoveHandlerById(
		keyEvent: KeyboardEvent | null,
		rowId: string,
		action?: 'up' | 'down' | 'delete'
	): Promise<void> {
		const itemIndex = this.getIndexByRowId(rowId);
		await this.listMoveHandler(keyEvent, itemIndex, action);
	}

	/*************************************************************************
	 * UTILITIES
	 *************************************************************************/

	getIndexByRowId(rowId: string): number {
		const list = this.getItemListEls();
		return Array.prototype.findIndex.call(list, (el: Element) => el.getAttribute('data-row-id') === rowId);
	}

	getItemListEls(): NodeListOf<HTMLElement> {
		return this.containerEl.querySelectorAll('.note-toolbar-sortablejs-list > div[data-row-id]');
	}

	getNavbarVisibilityMenu(button: ButtonComponent): Menu {
		const menu = new Menu();

		const { obsidianUiEls, obsidianUiSetting, allNavbarKeys, allHidden } = this.getNavbarState();

		menu.addItem((menuItem: MenuItem) => {
			menuItem
				.setTitle(allHidden ? t('setting.display-navbar.bottom.option-unhide-all') : t('setting.display-navbar.bottom.option-hide-all'))
				.setIcon(allHidden ? 'eye' : 'eye-off')
				.onClick(async () => {
					allNavbarKeys.forEach((key) => {
						this.ntb.settings.obsidianUiVisibility[key] = allHidden ? true : false;
					});
					this.updateNavbarVisibilityButton(button);
					await this.ntb.settingsManager.save();
				});
		});
		menu.addSeparator();

		OBSIDIAN_UI_MOBILE_NAVBAR_OPTIONS.forEach((key) => {
			const uiEl = obsidianUiEls.get(key);
			if (uiEl) {
				menu.addItem((menuItem: MenuItem) => {
					menuItem
						.setTitle(uiEl.label)
						.setIcon(uiEl.icon ? uiEl.icon : null)
						.setChecked(obsidianUiSetting.get(uiEl.key) ?? true)
						.onClick(async () => {
							const currentValue = this.ntb.settings.obsidianUiVisibility[uiEl.key] ?? true;
							this.ntb.settings.obsidianUiVisibility[uiEl.key] = !currentValue;
							this.updateNavbarVisibilityButton(button);
							await this.ntb.settingsManager.save();
						});
				});
			}
		});

		return menu;
	}

	getNavbarState(): { obsidianUiEls: Map<string, typeof OBSIDIAN_UI_ELEMENTS[number]>; obsidianUiSetting: Map<string, boolean>; allNavbarKeys: string[]; allHidden: boolean } {
		const obsidianUiEls = new Map(
			OBSIDIAN_UI_ELEMENTS.map(el => [el.key, el])
		);

		const obsidianUiSetting = new Map(
			Object.entries(this.ntb.settings.obsidianUiVisibility)
				.filter(([key]) => key.startsWith('mobile.navbar.'))
		);

		const allNavbarKeys = Array.from(
			obsidianUiEls.keys()).filter(key => key.startsWith('mobile.navbar.')
		);
		const allHidden = allNavbarKeys.every(key =>
			obsidianUiSetting.get(key) === false
		);

		return {
			obsidianUiEls,
			obsidianUiSetting,
			allNavbarKeys,
			allHidden
		};
	}

	updateNavbarVisibilityButton(button: ButtonComponent): void {
		const { obsidianUiSetting, allNavbarKeys, allHidden } = this.getNavbarState();
		if (allHidden) {
			button.setIcon('eye-off');
			button.setTooltip(t('setting.display-navbar.bottom.label-hidden'));
			return;
		}
		else if (allNavbarKeys.some(key => obsidianUiSetting.get(key) === false)) {
			button.setIcon('note-toolbar-eye-dashed');
			button.setTooltip(t('setting.display-navbar.bottom.label-partial'));
			return;
		}
		else {
			button.setIcon('eye');
			button.setTooltip(t('setting.display-navbar.bottom.label-visible'));
			return;
		}
	}

}
