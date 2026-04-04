import { debounce, Setting, SettingGroup, ToggleComponent } from 'obsidian';
import { t } from 'Settings/NoteToolbarSettings';
import { fixToggleTab, learnMoreFr } from '../Utils/SettingsUIUtils';
import { SettingsTabState } from './types';

export function displayFileTypeSettings(state: SettingsTabState, containerEl: HTMLElement): void {

	const { ntb } = state;

	const collapsibleEl = createDiv('note-toolbar-setting-contexts-container');
	collapsibleEl.setAttribute('data-active', state.isSectionOpen['contexts'].toString());

	const otherContextSettings = new Setting(collapsibleEl)
		.setHeading()
		.setName(t('setting.display-contexts.name'))
		.setDesc(learnMoreFr(t('setting.display-contexts.description'), 'File-types'));

	state.renderSettingToggle(otherContextSettings, '.note-toolbar-setting-contexts-container', 'contexts');

	const collapsibleContainerEl = createDiv();
	collapsibleContainerEl.addClass('note-toolbar-setting-items-collapsible-container');

	const fileTypeGroup = new SettingGroup(collapsibleContainerEl);

	fileTypeGroup.addSetting((audioSetting) => {
		audioSetting
			.setName(t('setting.display-contexts.option-audio'))
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.setValue(ntb.settings.showToolbarIn.audio)
					.onChange(async (value: boolean) => {
						ntb.settings.showToolbarIn.audio = value;
						await ntb.settingsManager.save();
					});
				fixToggleTab(toggle);
			});
	});

	fileTypeGroup.addSetting((basesSetting) => {
		basesSetting
			.setName(t('setting.display-contexts.option-bases'))
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.setValue(ntb.settings.showToolbarIn.bases)
					.onChange(async (value: boolean) => {
						ntb.settings.showToolbarIn.bases = value;
						await ntb.settingsManager.save();
					});
				fixToggleTab(toggle);
			});
	});

	fileTypeGroup.addSetting((canvasSetting) => {
		canvasSetting
			.setName(t('setting.display-contexts.option-canvas'))
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.setValue(ntb.settings.showToolbarIn.canvas)
					.onChange(async (value: boolean) => {
						ntb.settings.showToolbarIn.canvas = value;
						await ntb.settingsManager.save();
					});
				fixToggleTab(toggle);
			});
	});

	fileTypeGroup.addSetting((imageSetting) => {
		imageSetting
			.setName(t('setting.display-contexts.option-image'))
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.setValue(ntb.settings.showToolbarIn.image)
					.onChange(async (value: boolean) => {
						ntb.settings.showToolbarIn.image = value;
						await ntb.settingsManager.save();
					});
				fixToggleTab(toggle);
			});
	});

	fileTypeGroup.addSetting((kanbanSetting) => {
		kanbanSetting
			.setName(t('setting.display-contexts.option-kanban'))
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.setValue(ntb.settings.showToolbarIn.kanban)
					.onChange(async (value: boolean) => {
						ntb.settings.showToolbarIn.kanban = value;
						await ntb.settingsManager.save();
					});
				fixToggleTab(toggle);
			});
	});

	fileTypeGroup.addSetting((pdfSetting) => {
		pdfSetting
			.setName(t('setting.display-contexts.option-pdf'))
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.setValue(ntb.settings.showToolbarIn.pdf)
					.onChange(async (value: boolean) => {
						ntb.settings.showToolbarIn.pdf = value;
						await ntb.settingsManager.save();
					});
				fixToggleTab(toggle);
			});
	});

	fileTypeGroup.addSetting((videoSetting) => {
		videoSetting
			.setName(t('setting.display-contexts.option-video'))
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.setValue(ntb.settings.showToolbarIn.video)
					.onChange(async (value: boolean) => {
						ntb.settings.showToolbarIn.video = value;
						await ntb.settingsManager.save();
					});
				fixToggleTab(toggle);
			});
	});

	fileTypeGroup.addSetting((showToolbarInOtherSetting) => {
		showToolbarInOtherSetting
			.setName(t('setting.display-contexts.option-other'))
			.setDesc(learnMoreFr(t('setting.display-contexts.option-other-description'), 'File-types#Other-data-types'))
			.addText(text => text
				.setPlaceholder(t('setting.display-contexts.option-other-placeholder'))
				.setValue(ntb.settings.showToolbarInOther)
				.onChange(debounce(async (value) => {
					ntb.settings.showToolbarInOther = value;
					await ntb.settingsManager.save();
				}, 750)));
	});

	collapsibleEl.appendChild(collapsibleContainerEl);
	containerEl.appendChild(collapsibleEl);

}
