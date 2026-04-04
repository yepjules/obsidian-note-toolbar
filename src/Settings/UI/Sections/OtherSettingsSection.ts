import { setIcon, Setting, SettingGroup, ToggleComponent } from 'obsidian';
import { t } from 'Settings/NoteToolbarSettings';
import IconSuggestModal from '../Modals/IconSuggestModal';
import { fixToggleTab, learnMoreFr } from '../Utils/SettingsUIUtils';
import type { SettingsTabState } from './types';

export function displayOtherSettings(state: SettingsTabState, containerEl: HTMLElement): void {

	const { ntb } = state;

	new Setting(containerEl)
		.setClass('note-toolbar-setting-header-phone')
		.setHeading()
		.setName(t('setting.other.name'));

	const otherGroup = new SettingGroup(containerEl);

	otherGroup.addSetting((iconSetting) => {
		iconSetting
			.setName(t('setting.other.icon.name'))
			.setDesc(t('setting.other.icon.description'))
			.addButton((cb) => {
				cb.setIcon(ntb.settings.icon)
					.setTooltip(t('setting.other.icon.tooltip'))
					.onClick(async (e) => {
						e.preventDefault();
						const modal = new IconSuggestModal(
							ntb, ntb.settings.icon, false, (icon) => updateNoteToolbarIcon(state, cb.buttonEl, icon));
						modal.open();
					});
				cb.buttonEl.setAttribute("data-note-toolbar-no-icon", !ntb.settings.icon ? "true" : "false");
				ntb.registerDomEvent(
					cb.buttonEl, 'keydown', (e) => {
						switch (e.key) {
							case "Enter":
							case " ": {
								e.preventDefault();
								const modal = new IconSuggestModal(
									ntb, ntb.settings.icon, false, (icon) => updateNoteToolbarIcon(state, cb.buttonEl, icon));
								modal.open();
							}
						}
					});
			});
	});

	otherGroup.addSetting((keepPropsStateSetting) => {
		keepPropsStateSetting
			.setName(t('setting.other.keep-props-state.name'))
			.setDesc(t('setting.other.keep-props-state.description'))
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.setValue(ntb.settings.keepPropsState)
					.onChange(async (value) => {
						ntb.settings.keepPropsState = value;
						await ntb.settingsManager.save();
					});
				fixToggleTab(toggle);
			});
	});

	otherGroup.addSetting((lockCalloutsSetting) => {
		lockCalloutsSetting
			.setName(t('setting.other.lock-callouts.name'))
			.setDesc(t('setting.other.lock-callouts.description'))
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.setValue(ntb.settings.lockCallouts)
					.onChange(async (value) => {
						ntb.settings.lockCallouts = value;
						await ntb.settingsManager.save();
					});
				fixToggleTab(toggle);
			});
	});

	otherGroup.addSetting((scriptingSetting) => {
		scriptingSetting
			.setName(t('setting.other.scripting.name'))
			.setDesc(learnMoreFr(t('setting.other.scripting.description'), 'Executing-scripts'))
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.setValue(ntb.settings.scriptingEnabled)
					.onChange(async (value) => {
						ntb.settings.scriptingEnabled = value;
						ntb.adapters.updateAdapters();
						await ntb.settingsManager.save();
					});
				fixToggleTab(toggle);
			});
	});

	otherGroup.addSetting((showEditInFabMenuSetting) => {
		showEditInFabMenuSetting
			.setName(t('setting.other.show-edit-tbar.name'))
			.setDesc(t('setting.other.show-edit-tbar.description'))
			.addToggle((toggle) => {
				toggle.setValue(ntb.settings.showEditInFabMenu);
				toggle.onChange(async (value) => {
					ntb.settings.showEditInFabMenu = value;
					await ntb.settingsManager.save();
				});
				fixToggleTab(toggle);
			});
	});

	otherGroup.addSetting((debugSetting) => {
		debugSetting
			.setName(t('setting.other.debugging.name'))
			.setDesc(t('setting.other.debugging.description'))
			.addToggle((toggle) => {
				toggle.setValue(ntb.settings.debugEnabled);
				toggle.onChange(async (value) => {
					ntb.settings.debugEnabled = value;
					ntb.toggleDebugging();
					ntb.debug('Note Toolbar debugging:', value);
					await ntb.settingsManager.save();
				});
				fixToggleTab(toggle);
			});
	});
}

function updateNoteToolbarIcon(state: SettingsTabState, settingEl: HTMLElement, selectedIcon: string): void {
	const { ntb } = state;
	ntb.settings.icon = (selectedIcon === t('setting.icon-suggester.option-no-icon') ? "" : selectedIcon);
	ntb.settingsManager.save();
	setIcon(settingEl, selectedIcon === t('setting.icon-suggester.option-no-icon') ? 'lucide-plus-square' : selectedIcon);
	settingEl.setAttribute('data-note-toolbar-no-icon', selectedIcon === t('setting.icon-suggester.option-no-icon') ? 'true' : 'false');
}
