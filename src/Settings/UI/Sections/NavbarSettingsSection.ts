import { ButtonComponent, debounce, Platform, Setting, SettingGroup } from 'obsidian';
import { RIBBON_ACTION_OPTIONS, RibbonAction, SettingType, t } from 'Settings/NoteToolbarSettings';
import { getElementPosition } from 'Utils/Utils';
import ToolbarSuggester from '../Suggesters/ToolbarSuggester';
import { learnMoreFr } from '../Utils/SettingsUIUtils';
import type { SettingsTabState } from './types';

export function displayNavbarSettings(state: SettingsTabState, containerEl: HTMLElement): void {

	if (!Platform.isPhone) return;

	const { ntb } = state;

	const collapsibleEl = createDiv('note-toolbar-setting-navbar-container');
	collapsibleEl.setAttribute('data-active', state.isSectionOpen['navbar'].toString());

	const navbarSetting = new Setting(collapsibleEl)
		.setHeading()
		.setName(t('setting.display-navbar.name'))
		.setDesc(learnMoreFr(t('setting.display-navbar.description'), 'Toolbars-within-the-app'));

	state.renderSettingToggle(navbarSetting, '.note-toolbar-setting-navbar-container', 'navbar');

	const collapsibleContainerEl = createDiv();
	collapsibleContainerEl.addClass('note-toolbar-setting-items-collapsible-container');

	const navbarGroup = new SettingGroup(collapsibleContainerEl);

	navbarGroup.addSetting((headerVisibilitySetting) => {
		headerVisibilitySetting
			.setName(t('setting.display-navbar.top.name'))
			.setDesc(t('setting.display-navbar.top.description'))
			.addButton((button: ButtonComponent) => {
				button
					.setIcon(ntb.settings.obsidianUiVisibility?.['view-header'] === false ? 'eye-off' : 'eye')
					.onClick(() => {
						const currentValue = ntb.settings.obsidianUiVisibility['view-header'] ?? true;
						ntb.settings.obsidianUiVisibility['view-header'] = !currentValue;
						ntb.settingsManager.save();
						button.setIcon(!currentValue ? 'eye' : 'eye-off');
					});
			});
	});

	navbarGroup.addSetting((navbarVisibilitySetting) => {
		navbarVisibilitySetting
			.setName(t('setting.display-navbar.bottom.name'))
			.setDesc(t('setting.display-navbar.bottom.description'))
			.addButton((button: ButtonComponent) => {
				button
					.onClick(() => {
						const visibilityMenu = getNavbarVisibilityMenu(state, button);
						visibilityMenu.showAtPosition(getElementPosition(button.buttonEl));
					});
				updateNavbarVisibilityButton(state, button);
			});
	});

	navbarGroup.addSetting((ribbonActionSetting) => {
		ribbonActionSetting
			.setName(t('setting.display-navbar.ribbon-action.name'))
			.setDesc(learnMoreFr(t('setting.display-navbar.ribbon-action.description'), 'Toolbars-within-the-app#Ribbon-'))
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(RIBBON_ACTION_OPTIONS)
					.setValue(ntb.settings.ribbonAction)
					.onChange(async (value: RibbonAction) => {
						ntb.settings.ribbonAction = value;
						const hasRibbonToolbar = (value === RibbonAction.ToolbarSelected);
						const ribbonToolbarEl = state.containerEl.querySelector('#note-toolbar-ribbon-toolbar-setting');
						ribbonToolbarEl?.setAttribute('data-active', hasRibbonToolbar.toString());
						await ntb.settingsManager.save();
					})
			);
	});

	navbarGroup.addSetting((ribbonToolbarSetting) => {
		const existingRibbonToolbar = ntb.settingsManager.getToolbarById(ntb.settings.ribbonToolbar);
		ribbonToolbarSetting
			.setName(t('setting.display-navbar.ribbon-action.option-toolbar-selected-name'))
			.setDesc(t('setting.display-navbar.ribbon-action.option-toolbar-selected-description'))
			.setClass('note-toolbar-sub-setting-item')
			.setClass('note-toolbar-setting-item-control-std-with-help')
			.addSearch(async (cb) => {
				new ToolbarSuggester(ntb, cb.inputEl);
				cb.setPlaceholder(t('setting.display-navbar.ribbon-action.option-toolbar-selected-placeholder'))
					.setValue(existingRibbonToolbar ? existingRibbonToolbar.name : '')
					.onChange(debounce(async (name) => {
						const isValid = await ntb.settingsUtils.updateItemComponentStatus(state.settingTab, name, SettingType.Toolbar, ribbonToolbarSetting.controlEl, undefined, 'beforeend');
						const newToolbar = isValid ? ntb.settingsManager.getToolbarByName(name) : undefined;
						ntb.settings.ribbonToolbar = newToolbar?.uuid ?? null;
						ntb.settingsUtils.setFieldPreview(ribbonToolbarSetting, newToolbar);
						await ntb.settingsManager.save();
					}, 250));
				await ntb.settingsUtils.updateItemComponentStatus(state.settingTab, existingRibbonToolbar ? existingRibbonToolbar.name : '', SettingType.Toolbar, cb.inputEl.parentElement, undefined, 'beforeend');
			});
		ribbonToolbarSetting.settingEl.id = 'note-toolbar-ribbon-toolbar-setting';
		const hasRibbonToolbar = (ntb.settings.ribbonAction === RibbonAction.ToolbarSelected);
		ribbonToolbarSetting.settingEl.setAttribute('data-active', hasRibbonToolbar.toString());
		ntb.settingsUtils.setFieldPreview(ribbonToolbarSetting, existingRibbonToolbar);
	});

	collapsibleEl.appendChild(collapsibleContainerEl);
	containerEl.append(collapsibleEl);
}

function getNavbarVisibilityMenu(state: SettingsTabState, button: ButtonComponent) {
	return state.getNavbarVisibilityMenu(button);
}

function updateNavbarVisibilityButton(state: SettingsTabState, button: ButtonComponent): void {
	state.updateNavbarVisibilityButton(button);
}
