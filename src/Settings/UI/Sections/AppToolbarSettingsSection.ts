import { debounce, Platform, Setting, SettingGroup, ToggleComponent } from 'obsidian';
import { SettingType, t } from 'Settings/NoteToolbarSettings';
import TextToolbar from 'Toolbar/TextToolbar';
import ToolbarSuggester from '../Suggesters/ToolbarSuggester';
import { fixToggleTab, learnMoreFr } from '../Utils/SettingsUIUtils';
import { SettingsTabState } from './types';

export function displayAppToolbarSettings(state: SettingsTabState, containerEl: HTMLElement): void {

	const { ntb } = state;

	const settingsContainerEl = createDiv();
	settingsContainerEl.addClasses(['note-toolbar-setting-app-toolbars-container']);
	settingsContainerEl.setAttribute('data-active', state.isSectionOpen['appToolbars'].toString());

	const appToolbarSetting = new Setting(settingsContainerEl)
		.setHeading()
		.setName(t('setting.display-locations.name'))
		.setDesc(learnMoreFr(t('setting.display-locations.description'), 'Toolbars-within-the-app'));

	// make collapsible
	state.renderSettingToggle(appToolbarSetting, '.note-toolbar-setting-app-toolbars-container', 'appToolbars');

	const collapsibleContainerEl = createDiv();
	collapsibleContainerEl.addClass('note-toolbar-setting-items-collapsible-container');

	const appToolbarGroup = new SettingGroup(collapsibleContainerEl);

	//
	// Editor menu
	//

	if (Platform.isDesktop) {
		appToolbarGroup.addSetting((editorMenuSetting) => {
			const existingEditorMenuToolbar = ntb.settingsManager.getToolbarById(ntb.settings.editorMenuToolbar);
			editorMenuSetting
				.setName(t('setting.display-locations.option-editor-menu'))
				.setDesc(learnMoreFr(t('setting.display-locations.option-editor-menu-description'), 'Toolbars-within-the-app#Editor-menu'))
				.setClass('note-toolbar-setting-item-control-std-with-help')
				.addSearch(async (cb) => {
					new ToolbarSuggester(ntb, cb.inputEl);
					cb.setPlaceholder(t('setting.display-locations.option-editor-menu-placeholder'))
						.setValue(existingEditorMenuToolbar ? existingEditorMenuToolbar.name : '')
						.onChange(debounce(async (name) => {
							const isValid = await ntb.settingsUtils.updateItemComponentStatus(state.settingTab, name, SettingType.Toolbar, editorMenuSetting.controlEl, undefined, 'beforeend');
							const newToolbar = isValid ? ntb.settingsManager.getToolbarByName(name) : undefined;
							ntb.settings.editorMenuToolbar = newToolbar?.uuid ?? null;
							// toggle editor menu as toolbar setting
							const hasEditorMenuToolbar = !!ntb.settings.editorMenuToolbar;
							const editorMenuAsTbarSettingEl = state.containerEl.querySelector('#note-toolbar-editor-menu-as-tbar-setting');
							editorMenuAsTbarSettingEl?.setAttribute('data-active', hasEditorMenuToolbar.toString());
							ntb.settingsUtils.setFieldPreview(editorMenuSetting, newToolbar);
							await ntb.settingsManager.save();
						}, 250));
					await ntb.settingsUtils.updateItemComponentStatus(state.settingTab, existingEditorMenuToolbar ? existingEditorMenuToolbar.name : '', SettingType.Toolbar, cb.inputEl.parentElement, undefined, 'beforeend');
				});
			ntb.settingsUtils.setFieldPreview(editorMenuSetting, existingEditorMenuToolbar);
		});

		appToolbarGroup.addSetting((editorMenuAsTbarSetting) => {
			editorMenuAsTbarSetting
				.setName(t('setting.display-locations.option-editor-menu-as-tbar'))
				.setDesc(t('setting.display-locations.option-editor-menu-as-tbar-description'))
				.setClass('note-toolbar-sub-setting-item')
				.addToggle((toggle: ToggleComponent) => {
					toggle
						.setValue(ntb.settings.editorMenuAsToolbar)
						.onChange(async (value: boolean) => {
							ntb.settings.editorMenuAsToolbar = value;
							await ntb.settingsManager.save();
						});
					fixToggleTab(toggle);
				});
			editorMenuAsTbarSetting.settingEl.id = 'note-toolbar-editor-menu-as-tbar-setting';
			const hasEditorMenuToolbar = !!ntb.settings.editorMenuToolbar;
			editorMenuAsTbarSetting.settingEl.setAttribute('data-active', hasEditorMenuToolbar.toString());
		});
	}

	//
	// File menu
	//

	appToolbarGroup.addSetting((showToolbarInFileMenuSetting) => {
		showToolbarInFileMenuSetting
			.setName(t('setting.display-contexts.option-filemenu'))
			.setDesc(learnMoreFr(t('setting.display-contexts.option-filemenu-description'), 'Toolbars-within-the-app#File-menu'))
			.addToggle((toggle: ToggleComponent) => {
				toggle.setValue(ntb.settings.showToolbarInFileMenu)
				toggle.onChange(async (value) => {
					ntb.settings.showToolbarInFileMenu = value;
					await ntb.settingsManager.save();
				});
				fixToggleTab(toggle);
			});
	});

	//
	// New tab view
	//

	appToolbarGroup.addSetting((emptyViewSetting) => {
		const existingEmptyViewToolbar = ntb.settingsManager.getToolbarById(ntb.settings.emptyViewToolbar);
		emptyViewSetting
			.setName(t('setting.display-locations.option-emptyview-tbar'))
			.setDesc(t('setting.display-locations.option-emptyview-tbar-description'))
			.setClass('note-toolbar-setting-item-control-std-with-help')
			.addSearch(async (cb) => {
				new ToolbarSuggester(ntb, cb.inputEl);
				cb.setPlaceholder(t('setting.display-locations.option-emptyview-tbar-placeholder'))
					.setValue(existingEmptyViewToolbar ? existingEmptyViewToolbar.name : '')
					.onChange(debounce(async (name) => {
						const isValid = await ntb.settingsUtils.updateItemComponentStatus(state.settingTab, name, SettingType.Toolbar, emptyViewSetting.controlEl, undefined, 'beforeend');
						const newToolbar = isValid ? ntb.settingsManager.getToolbarByName(name) : undefined;
						ntb.settings.emptyViewToolbar = newToolbar?.uuid ?? null;
						// toggle launchpad setting
						const hasEmptyViewToolbar = !!ntb.settings.emptyViewToolbar;
						const launchpadSettingEl = state.containerEl.querySelector('#note-toolbar-launchpad-setting');
						launchpadSettingEl?.setAttribute('data-active', hasEmptyViewToolbar.toString());
						// update toolbar preview
						ntb.settingsUtils.setFieldPreview(emptyViewSetting, newToolbar);
						await ntb.settingsManager.save();
					}, 250));
				await ntb.settingsUtils.updateItemComponentStatus(state.settingTab, existingEmptyViewToolbar ? existingEmptyViewToolbar.name : '', SettingType.Toolbar, cb.inputEl.parentElement, undefined, 'beforeend');
			});
		ntb.settingsUtils.setFieldPreview(emptyViewSetting, existingEmptyViewToolbar);
	});

	appToolbarGroup.addSetting((launchpadSetting) => {
		launchpadSetting
			.setName(t('setting.display-locations.option-launchpad'))
			.setDesc(learnMoreFr(t('setting.display-locations.option-launchpad-description'), 'Toolbars-within-the-app#new-tab-view'))
			.setClass('note-toolbar-sub-setting-item')
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.setValue(ntb.settings.showLaunchpad)
					.onChange(async (value: boolean) => {
						ntb.settings.showLaunchpad = value;
						await ntb.settingsManager.save();
					});
				fixToggleTab(toggle);
			});
		launchpadSetting.settingEl.id = 'note-toolbar-launchpad-setting';
		const hasEmptyViewToolbar = !!ntb.settings.emptyViewToolbar;
		launchpadSetting.settingEl.setAttribute('data-active', hasEmptyViewToolbar.toString());
	});

	//
	// Selected text
	//

	appToolbarGroup.addSetting((textToolbarSetting) => {
		const existingTextToolbar = ntb.settingsManager.getToolbarById(ntb.settings.textToolbar);
		textToolbarSetting
			.setName(t('setting.display-locations.option-text'))
			.setDesc(learnMoreFr(t('setting.display-locations.option-text-description'), 'Toolbars-within-the-app#Selected-text'))
			.setClass('note-toolbar-setting-item-control-std-with-help')
			.addSearch(async (cb) => {
				new ToolbarSuggester(ntb, cb.inputEl);
				cb.setPlaceholder(t('setting.display-locations.option-text-placeholder'))
					.setValue(existingTextToolbar ? existingTextToolbar.name : '')
					.onChange(debounce(async (name) => {
						const isValid = await ntb.settingsUtils.updateItemComponentStatus(state.settingTab, name, SettingType.Toolbar, textToolbarSetting.controlEl, undefined, 'beforeend');
						const newToolbar = isValid ? ntb.settingsManager.getToolbarByName(name) : undefined;
						ntb.settings.textToolbar = newToolbar?.uuid ?? null;
						if (ntb.settings.textToolbar && !ntb.textToolbar) {
							ntb.textToolbar = TextToolbar(ntb);
							ntb.registerEditorExtension(ntb.textToolbar);
						}
						// toggle keyboard setting
						const hasTextToolbar = !!ntb.settings.textToolbar;
						const textToolbarOnKeyboardSettingEl = state.containerEl.querySelector('#ntb-text-tbar-keyboard-setting');
						textToolbarOnKeyboardSettingEl?.setAttribute('data-active', hasTextToolbar.toString());
						// update toolbar preview
						ntb.settingsUtils.setFieldPreview(textToolbarSetting, newToolbar);
						await ntb.settingsManager.save();
					}, 250));
				await ntb.settingsUtils.updateItemComponentStatus(state.settingTab, existingTextToolbar ? existingTextToolbar.name : '', SettingType.Toolbar, cb.inputEl.parentElement, undefined, 'beforeend');
			});
		ntb.settingsUtils.setFieldPreview(textToolbarSetting, existingTextToolbar);
	});

	appToolbarGroup.addSetting((textToolbarOnKeyboardSetting) => {
		textToolbarOnKeyboardSetting
			.setName(t('setting.display-locations.option-text-on-keyboard'))
			.setDesc(t('setting.display-locations.option-text-on-keyboard-description'))
			.setClass('note-toolbar-sub-setting-item')
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.setValue(ntb.settings.textToolbarOnKeyboard)
					.onChange(async (value: boolean) => {
						ntb.settings.textToolbarOnKeyboard = value;
						await ntb.settingsManager.save();
					});
				fixToggleTab(toggle);
			});
		textToolbarOnKeyboardSetting.settingEl.id = 'ntb-text-tbar-keyboard-setting';
		const hasTextToolbar = !!ntb.settings.textToolbar;
		textToolbarOnKeyboardSetting.settingEl.setAttribute('data-active', hasTextToolbar.toString());
	});

	//
	// Web viewer
	//

	if (Platform.isDesktop) {
		if (ntb.adapters.isInternalPluginEnabled('webviewer')) {
			appToolbarGroup.addSetting((webToolbarSetting) => {
				const existingWebToolbar = ntb.settingsManager.getToolbarById(ntb.settings.webviewerToolbar);
				webToolbarSetting
					.setName(t('setting.display-locations.option-webviewer'))
					.setDesc(t('setting.display-locations.option-webviewer-description'))
					.setClass('note-toolbar-setting-item-control-std-with-help')
					.addSearch(async (cb) => {
						new ToolbarSuggester(ntb, cb.inputEl);
						cb.setPlaceholder(t('setting.display-locations.option-webviewer-placeholder'))
							.setValue(existingWebToolbar ? existingWebToolbar.name : '')
							.onChange(debounce(async (name) => {
								const isValid = await ntb.settingsUtils.updateItemComponentStatus(state.settingTab, name, SettingType.Toolbar, webToolbarSetting.controlEl, undefined, 'beforeend');
								const newToolbar = isValid ? ntb.settingsManager.getToolbarByName(name) : undefined;
								ntb.settings.webviewerToolbar = newToolbar?.uuid ?? null;
								ntb.settingsUtils.setFieldPreview(webToolbarSetting, newToolbar);
								await ntb.settingsManager.save();
							}, 250));
						await ntb.settingsUtils.updateItemComponentStatus(state.settingTab, existingWebToolbar ? existingWebToolbar.name : '', SettingType.Toolbar, cb.inputEl.parentElement, undefined, 'beforeend');
					});
				ntb.settingsUtils.setFieldPreview(webToolbarSetting, existingWebToolbar);
			});
		}
	}

	settingsContainerEl.appendChild(collapsibleContainerEl);
	containerEl.append(settingsContainerEl);

}
