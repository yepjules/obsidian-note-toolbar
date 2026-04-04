import { ButtonComponent, Menu, MenuItem, Notice, Platform, setIcon, Setting, setTooltip } from 'obsidian';
import { t, ToolbarSettings } from 'Settings/NoteToolbarSettings';
import { exportToCallout } from 'Utils/ImportExport';
import { getElementPosition } from 'Utils/Utils';
import { importFromModal } from '../Modals/ImportModal';
import ShareModal from '../Modals/ShareModal';
import { iconTextFr, learnMoreFr } from '../Utils/SettingsUIUtils';
import { SettingsTabState } from './types';

export function displayToolbarList(state: SettingsTabState, containerEl: HTMLElement): void {

	const { ntb } = state;

	const itemsListContainer = createDiv();
	itemsListContainer.addClass('note-toolbar-setting-items-list-container');

	const itemsContainer = createDiv();
	itemsContainer.addClass('note-toolbar-setting-items-container');
	itemsContainer.setAttribute('data-active', state.isSectionOpen['itemList'].toString());

	const toolbarListHeading = state.isSectionOpen['itemList'] ? t('setting.toolbars.name') : t('setting.toolbars.name-with-count', { count: ntb.settings.toolbars.length });
	const toolbarListSetting = new Setting(itemsContainer)
		.setName(toolbarListHeading)
		.setHeading();

	// search button (or field on desktop)
	if (ntb.settings.toolbars.length > 4) {
		if (!Platform.isPhone) {
			// search field
			renderSearchField(state, toolbarListSetting.controlEl);
		}
		else {
			toolbarListSetting
				.addExtraButton((cb) => {
					cb.setIcon('search')
					.setTooltip(t('setting.search.button-tooltip'))
					.onClick(async () => {
						toggleSearch(state);
						// un-collapse list container if it's collapsed
						if (!state.isSectionOpen['itemList']) {
							toggleToolbarList(state);
						}
					});
					ntb.settingsUtils.handleKeyClick(cb.extraSettingsEl);
					// used to set focus on settings display
					cb.extraSettingsEl.id = 'ntb-tbar-search-button';
				});
		}
	}

	// import button
	toolbarListSetting
		.addExtraButton((cb) => {
			cb.setIcon('import')
			.setTooltip(t('import.button-import-tooltip'))
			.onClick(async () => {
				importFromModal(
					ntb
				).then(async (importedToolbar: ToolbarSettings) => {
					if (importedToolbar) {
						await ntb.settingsManager.addToolbar(importedToolbar);
						await ntb.settingsManager.save();
						await ntb.commands.openToolbarSettingsForId(importedToolbar.uuid);
						state.refresh();
					}
				});
			});
			ntb.settingsUtils.handleKeyClick(cb.extraSettingsEl);
		});

	// search field (phone)
	if (ntb.settings.toolbars.length > 4) {
		if (Platform.isPhone) renderSearchField(state, itemsContainer);
	}

	// make collapsible
	if (ntb.settings.toolbars.length > 4) {
		state.renderSettingToggle(toolbarListSetting, '.note-toolbar-setting-items-container', 'itemList', () => {
			toolbarListSetting.setName(
				state.isSectionOpen['itemList'] ? t('setting.toolbars.name') : t('setting.toolbars.name-with-count', { count: ntb.settings.toolbars.length }));
		});
	}

	const toolbarListDiv = createDiv();
	toolbarListDiv.addClass("note-toolbar-setting-toolbar-list");
	if (ntb.settings.toolbars.length == 0) {

		const emptyMsgEl = createDiv({ text:
			// eslint-disable-next-line @typescript-eslint/no-misused-promises -- emptyMessageFr callback typed as void; async is intentional
			ntb.settingsUtils.emptyMessageFr(t('setting.toolbars.label-empty-create-tbar'), t('setting.toolbars.link-create'), async () => {
				const newToolbar = await ntb.settingsManager.newToolbar();
				ntb.settingsManager.openToolbarSettings(newToolbar, state.settingTab);
			}) });
		emptyMsgEl.addClass('note-toolbar-setting-empty-message');
		toolbarListDiv.append(emptyMsgEl);

	}
	else {
		ntb.settings.toolbars.forEach(
			(toolbar) => {

				const toolbarNameFr = document.createDocumentFragment();
				toolbarNameFr.append(toolbar.name ? toolbar.name : t('setting.toolbars.label-tbar-name-not-set'));
				// show hotkey
				if (!Platform.isPhone) {
					const tbarCommand = ntb.commands.getCommandFor(toolbar);
					if (tbarCommand) {
						const hotkeyEl = ntb.hotkeys.getHotkeyEl(tbarCommand);
						if (hotkeyEl) {
							toolbarNameFr.appendChild(hotkeyEl);
							setTooltip(hotkeyEl, t('setting.use-item-command.tooltip-command-indicator', { command: tbarCommand.name, interpolation: { escapeValue: false } }));
						}
						else {
							const commandIconEl = toolbarNameFr.createSpan();
							commandIconEl.addClass('note-toolbar-setting-command-indicator');
							setIcon(commandIconEl, 'terminal');
							setTooltip(commandIconEl, t('setting.use-item-command.tooltip-command-indicator', { command: tbarCommand.name, interpolation: { escapeValue: false } }));
						}
					}
				}

				const toolbarListItemSetting = new Setting(toolbarListDiv)
					.setName(toolbarNameFr)
					.addButton((button: ButtonComponent) => {
						button
							.setIcon('more-horizontal')
							.setTooltip(t('setting.toolbars.button-more-tooltip'))
							.onClick(() => {
								const menu = new Menu();
								menu.addItem((menuItem: MenuItem) => {
									menuItem
										.setTitle(t('setting.toolbars.button-duplicate-tbar-tooltip'))
										.setIcon('copy-plus')
										.onClick(async () => {
											ntb.settingsManager.duplicateToolbar(toolbar).then((newToolbarUuid) => {
												state.refresh(`.note-toolbar-setting-toolbar-list > div[data-tbar-uuid="${newToolbarUuid}"] > .setting-item-control > .mod-cta`);
											});
										});
								});
								if (toolbar.items.length > 0) {
									menu.addSeparator();
									menu.addItem((menuItem: MenuItem) => {
										menuItem
											.setTitle(t('export.label-share'))
											.setIcon('share')
											.onClick(async () => {
												const shareUri = await ntb.protocolManager.getShareUri(toolbar);
												const shareModal = new ShareModal(ntb, shareUri, toolbar);
												shareModal.open();
											});
									});
									menu.addItem((menuItem: MenuItem) => {
										menuItem
											.setTitle(t('export.label-callout'))
											.setIcon('copy')
											.onClick(async () => {
												const calloutExport = await exportToCallout(ntb, toolbar, ntb.settings.export);
												navigator.clipboard.writeText(calloutExport);
												new Notice(
													learnMoreFr(t('export.notice-completed'), 'Creating-callouts-from-toolbars')
												).containerEl.addClass('mod-success');
											});
									});
								}
								menu.addSeparator();
								menu.addItem((menuItem: MenuItem) => {
									menuItem
										.setTitle(t('setting.toolbars.menu-copy-id'))
										.setIcon('code')
										.onClick(async () => {
											navigator.clipboard.writeText(toolbar.uuid);
											new Notice(t('setting.toolbars.menu-copy-id-notice')).containerEl.addClass('mod-success');
										});
								});
								menu.addSeparator();
								menu.addItem((menuItem: MenuItem) => {
									menuItem
										.setTitle(t('setting.delete-toolbar.button-delete'))
										.setIcon('minus-circle')
										.onClick(async () => {
											ntb.settingsUtils.confirmDeleteToolbar(toolbar, () => state.refresh());
										})
										.setWarning(true);
								});
								menu.showAtPosition(getElementPosition(button.buttonEl));
							});
						// used to distinguish buttons for keyboard navigation
						button.buttonEl.addClass('ntb-tbar-more');
					})
					.addButton((button: ButtonComponent) => {
						button
							.setTooltip(t('setting.toolbars.button-edit-tbar-tooltip'))
							.setButtonText(t('setting.toolbars.button-edit-tbar'))
							.onClick(() => {
								ntb.settingsManager.openToolbarSettings(toolbar, state.settingTab);
							});
						// used to distinguish buttons for keyboard navigation
						button.buttonEl.addClass('ntb-tbar-edit');
					});

				// for performance, render previews after a slight delay
				requestAnimationFrame(() => {
					toolbarListItemSetting.descEl.append(ntb.settingsUtils.createToolbarPreviewFr(toolbar, ntb.settingsManager));
				});

				toolbarListItemSetting.settingEl.setAttribute('data-tbar-uuid', toolbar.uuid);
				toolbar.name ? undefined : toolbarListItemSetting.nameEl.addClass('mod-warning');

				ntb.registerDomEvent(
					toolbarListItemSetting.settingEl, 'keydown', (e: KeyboardEvent) => {
						switch (e.key) {
							case "d": {
								const modifierPressed = (Platform.isWin || Platform.isLinux) ? e?.ctrlKey : e?.metaKey;
								if (modifierPressed) {
									ntb.settingsManager.duplicateToolbar(toolbar).then((newToolbarUuid) => {
										state.refresh(`.note-toolbar-setting-toolbar-list > div[data-tbar-uuid="${newToolbarUuid}"] > .setting-item-control > .mod-cta`);
									});
								}
							}
						}
				});
			}
		);

		// support up/down arrow keys
		ntb.registerDomEvent(
			toolbarListDiv, 'keydown', (keyEvent) => {
				if (!['ArrowUp', 'ArrowDown'].contains(keyEvent.key)) return;
				const currentFocussed = activeDocument.activeElement as HTMLElement;
				if (currentFocussed) {
					const buttonSelector = `.setting-item-control > button.${currentFocussed.className}`;
					const toolbarButtonEls = Array.from(toolbarListDiv.querySelectorAll<HTMLElement>(buttonSelector))
						.filter((btn) => getComputedStyle(btn.closest('.setting-item')!).display !== 'none');
					const currentIndex = toolbarButtonEls.indexOf(currentFocussed);
					switch (keyEvent.key) {
						case 'ArrowUp':
							if (currentIndex > 0) {
								toolbarButtonEls[currentIndex - 1].focus();
								keyEvent.preventDefault();
							}
							break;
						case 'ArrowDown':
							if (currentIndex < toolbarButtonEls.length - 1) {
								toolbarButtonEls[currentIndex + 1].focus();
								keyEvent.preventDefault();
							}
							break;
					}
				}
			}
		);
	}

	itemsListContainer.appendChild(toolbarListDiv);
	itemsContainer.appendChild(itemsListContainer);

	// add toolbar
	new Setting(itemsContainer)
		.setClass('note-toolbar-setting-button')
		.setClass('note-toolbar-setting-no-background')
		.addButton((button: ButtonComponent) => {
			button
				.setTooltip(t('setting.toolbars.button-new-tbar-tooltip'))
				.setCta()
				.onClick(async () => {
					const newToolbar = await ntb.settingsManager.newToolbar();
					ntb.settingsManager.openToolbarSettings(newToolbar, state.settingTab);
				});
			button.buttonEl.setText(iconTextFr('plus', t('setting.toolbars.button-new-tbar')));
		});

	containerEl.append(itemsContainer);

}

function renderSearchField(state: SettingsTabState, containerEl: HTMLElement): void {
	const { ntb } = state;
	const toolbarSearchSetting = new Setting(containerEl);
	toolbarSearchSetting
		.setClass('note-toolbar-setting-no-border')
		.setClass('note-toolbar-setting-no-background')
		.addSearch((cb) => {
			cb.setPlaceholder(t('setting.search.field-placeholder'))
			.onChange((search: string) => {
				if (!Platform.isPhone && !state.isSectionOpen['itemList']) {
					toggleToolbarList(state);
				}
				const query = search.toLowerCase();
				let firstVisibleSet = false;
				let hasMatch = false;
				state.containerEl
					.querySelectorAll<HTMLElement>('.note-toolbar-setting-toolbar-list .setting-item')
					.forEach((toolbarEl) => {
						// search contents of name and item text
						const toolbarName = toolbarEl.querySelector('.setting-item-name')?.textContent?.toLowerCase() ?? '';
						const allItemText = Array.from(toolbarEl.querySelectorAll('*:not(svg)'))
							.flatMap(el => Array.from(el.childNodes))
							.filter(node => node.nodeType === Node.TEXT_NODE)
							.map(node => node.textContent?.trim())
							.filter(text => text)
							.join(' ')
							.toLowerCase();

						const toolbarNameMatches = toolbarName.includes(query);
						const itemTextMatches = allItemText.includes(query);

						// hide non-matching results
						(toolbarNameMatches || itemTextMatches) ? toolbarEl.show() : toolbarEl.hide();

						hasMatch = hasMatch || ((toolbarNameMatches || itemTextMatches) && query.length > 0);

						// remove the top border on the first search result
						if ((toolbarNameMatches || itemTextMatches) && !firstVisibleSet) {
							toolbarEl.classList.add('note-toolbar-setting-no-border');
							firstVisibleSet = true;
						} else {
							toolbarEl.classList.remove('note-toolbar-setting-no-border');
						}
					});

				// if no results, show "no results" message
				const toolbarListEl = state.containerEl.querySelector('.note-toolbar-setting-toolbar-list') as HTMLElement;
				toolbarListEl?.querySelector('.note-toolbar-setting-empty-message')?.remove();
				if (!hasMatch && query.length > 0) {
					toolbarListEl?.createDiv({
						text: ntb.settingsUtils.emptyMessageFr(t('setting.search.label-no-results')),
						cls: 'note-toolbar-setting-empty-message'
					});
				}

			});
		});
	toolbarSearchSetting.settingEl.id = 'tbar-search';

	const searchInputEl = toolbarSearchSetting.settingEl.querySelector('input');

	// allow keyboard navigation down to first search result
	if (searchInputEl) {
		ntb.registerDomEvent(
			searchInputEl, 'keydown', (e) => {
				switch (e.key) {
					case 'ArrowDown': {
						const selector = '.note-toolbar-setting-toolbar-list .ntb-tbar-edit';
						const toolbarButtonEls = Array.from(state.containerEl.querySelectorAll<HTMLElement>(selector))
							.filter((btn) => getComputedStyle(btn.closest('.setting-item')!).display !== 'none');
						if (toolbarButtonEls.length > 0) toolbarButtonEls[0].focus();
						e.preventDefault();
						break;
					}
				}
			}
		)
	}

	if (Platform.isPhone) {
		toolbarSearchSetting.settingEl.setAttribute('data-active', 'false');
		// search field: remove if it's empty and loses focus
		if (searchInputEl) {
			ntb.registerDomEvent(
				searchInputEl, 'blur', (e) => {
					const searchButtonClicked = (e.relatedTarget as HTMLElement)?.id === 'ntb-tbar-search-button';
					if (!searchInputEl.value && !searchButtonClicked) {
						const searchEl = containerEl.querySelector('#tbar-search') as HTMLElement;
						searchEl?.setAttribute('data-active', 'false');
					}
				}
			);
		}
	}
	else {
		toolbarSearchSetting.settingEl.setCssProps({'padding-bottom': 'unset'});
	}
}

function toggleSearch(state: SettingsTabState, isVisible?: boolean): void {
	const toolbarSearchEl = state.containerEl.querySelector('#tbar-search') as HTMLElement;
	if (toolbarSearchEl) {
		const searchActive =
			(isVisible !== undefined) ? (!isVisible).toString() : toolbarSearchEl.getAttribute('data-active');
		if (searchActive === 'true') {
			toolbarSearchEl.setAttribute('data-active', 'false');
			// clear search value
			const searchInputEl = toolbarSearchEl.querySelector('input');
			if (searchInputEl) {
				searchInputEl.value = '';
				searchInputEl.trigger('input');
				searchInputEl.blur();
			}
		}
		else {
			toolbarSearchEl.setAttribute('data-active', 'true');
			// set focus in search field
			const searchInputEl = toolbarSearchEl?.querySelector('input');
			setTimeout(() => {
				searchInputEl?.focus();
			}, 50);
		}
	}
}

function toggleToolbarList(state: SettingsTabState): void {
	const itemsContainer = state.containerEl.querySelector('.note-toolbar-setting-items-container');
	if (itemsContainer) {
		state.isSectionOpen['itemList'] = !state.isSectionOpen['itemList'];
		itemsContainer.setAttribute('data-active', state.isSectionOpen['itemList'].toString());
		const headingEl = itemsContainer.querySelector('.setting-item-info .setting-item-name');
		state.isSectionOpen['itemList'] ? headingEl?.setText(t('setting.toolbars.name')) : headingEl?.setText(t('setting.toolbars.name-with-count', { count: state.ntb.settings.toolbars.length }));
	}
}
