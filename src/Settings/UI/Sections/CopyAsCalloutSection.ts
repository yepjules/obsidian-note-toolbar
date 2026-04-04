import { Setting, SettingGroup, ToggleComponent } from 'obsidian';
import { t } from 'Settings/NoteToolbarSettings';
import { fixToggleTab, learnMoreFr } from '../Utils/SettingsUIUtils';
import type { SettingsTabState } from './types';

export function displayCopyAsCalloutSettings(state: SettingsTabState, containerEl: HTMLElement): void {

	const { ntb } = state;

	const collapsibleEl = createDiv();
	collapsibleEl.addClass('note-toolbar-setting-callout-container');
	collapsibleEl.setAttribute('data-active', state.isSectionOpen['callouts'].toString());

	const copyAsCalloutSetting = new Setting(collapsibleEl)
		.setName(t('setting.copy-as-callout.title'))
		.setDesc(learnMoreFr(t('setting.copy-as-callout.description'), 'Creating-callouts-from-toolbars'))
		.setHeading();

	state.renderSettingToggle(copyAsCalloutSetting, '.note-toolbar-setting-callout-container', 'callouts');

	const collapsibleContainerEl = createDiv();
	collapsibleContainerEl.addClass('note-toolbar-setting-items-collapsible-container');

	const calloutGroup = new SettingGroup(collapsibleContainerEl);

	calloutGroup.addSetting((includeIconsSetting) => {
		includeIconsSetting
			.setName(t('setting.copy-as-callout.option-icons'))
			.setDesc(t('setting.copy-as-callout.option-icons-description'))
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.setValue(ntb.settings.export.includeIcons)
					.onChange(async (value) => {
						ntb.settings.export.includeIcons = value;
						await ntb.settingsManager.save();
					});
				fixToggleTab(toggle);
			});
	});

	calloutGroup.addSetting((replaceVarsSetting) => {
		replaceVarsSetting
			.setName(t('setting.copy-as-callout.option-vars'))
			.setDesc(t('setting.copy-as-callout.option-vars-description', { interpolation: { skipOnVariables: true } }))
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.setValue(ntb.settings.export.replaceVars)
					.onChange(async (value) => {
						ntb.settings.export.replaceVars = value;
						await ntb.settingsManager.save();
					});
				fixToggleTab(toggle);
			});
	});

	calloutGroup.addSetting((useIdsSetting) => {
		useIdsSetting
			.setName(t('setting.copy-as-callout.option-ids'))
			.setDesc(t('setting.copy-as-callout.option-ids-description'))
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.setValue(ntb.settings.export.useIds)
					.onChange(async (value) => {
						ntb.settings.export.useIds = value;
						await ntb.settingsManager.save();
					});
				fixToggleTab(toggle);
			});
	});

	calloutGroup.addSetting((useDataElsSetting) => {
		useDataElsSetting
			.setName(t('setting.copy-as-callout.option-data'))
			.setDesc(t('setting.copy-as-callout.option-data-description'))
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.setValue(ntb.settings.export.useDataEls)
					.onChange(async (value) => {
						ntb.settings.export.useDataEls = value;
						await ntb.settingsManager.save();
					});
				fixToggleTab(toggle);
			});
	});

	collapsibleEl.appendChild(collapsibleContainerEl);
	containerEl.appendChild(collapsibleEl);
}
