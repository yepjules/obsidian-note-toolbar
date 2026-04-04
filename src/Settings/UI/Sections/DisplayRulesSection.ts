import { ButtonComponent, debounce, normalizePath, Setting, SettingGroup } from 'obsidian';
import { FolderMapping, SettingType, t } from 'Settings/NoteToolbarSettings';
import Sortable from 'sortablejs';
import { moveElement } from 'Utils/Utils';
import FolderSuggester from '../Suggesters/FolderSuggester';
import ToolbarSuggester from '../Suggesters/ToolbarSuggester';
import { iconTextFr, learnMoreFr } from '../Utils/SettingsUIUtils';
import { SettingsTabState } from './types';

export function displayRules(state: SettingsTabState, containerEl: HTMLElement): void {

	const { ntb } = state;

	const settingsContainerEl = createDiv();
	settingsContainerEl.addClasses(['note-toolbar-setting-mappings-container']);
	settingsContainerEl.setAttribute('data-active', state.isSectionOpen['displayRules'].toString());

	const rulesSetting = new Setting(settingsContainerEl)
		.setHeading()
		.setName(t('setting.display-rules.name'))
		.setDesc(learnMoreFr(t('setting.display-rules.description'), 'Defining-where-to-show-toolbars'));

	// make collapsible
	state.renderSettingToggle(rulesSetting, '.note-toolbar-setting-mappings-container', 'displayRules');

	const collapsibleContainerEl = createDiv();
	collapsibleContainerEl.addClass('note-toolbar-setting-items-collapsible-container');

	displayMappingsSettings(state, collapsibleContainerEl);

	settingsContainerEl.appendChild(collapsibleContainerEl);
	containerEl.append(settingsContainerEl);

}

function displayMappingsSettings(state: SettingsTabState, containerEl: HTMLElement): void {

	const { ntb } = state;

	const mappingsGroup = new SettingGroup(containerEl);

	mappingsGroup.addSetting((defaultToolbarSetting) => {
		const existingDefaultToolbar = ntb.settingsManager.getToolbarById(ntb.settings.defaultToolbar);
		defaultToolbarSetting
			.setName(t('setting.display-rules.option-default'))
			.setDesc(t('setting.display-rules.option-default-description'))
			.setClass('note-toolbar-setting-item-control-std-with-help')
			.addSearch(async (cb) => {
				new ToolbarSuggester(ntb, cb.inputEl);
				cb.setPlaceholder(t('setting.display-rules.option-default-placeholder'))
					.setValue(existingDefaultToolbar ? existingDefaultToolbar.name : '')
					.onChange(debounce(async (name) => {
						const isValid = await ntb.settingsUtils.updateItemComponentStatus(state.settingTab, name, SettingType.Toolbar, defaultToolbarSetting.controlEl, undefined, 'beforeend');
						const newToolbar = isValid ? ntb.settingsManager.getToolbarByName(name) : undefined;
						ntb.settings.defaultToolbar = newToolbar?.uuid ?? null;
						ntb.settingsUtils.setFieldPreview(defaultToolbarSetting, newToolbar);
						await ntb.settingsManager.save();
					}, 250));
				await ntb.settingsUtils.updateItemComponentStatus(state.settingTab, existingDefaultToolbar ? existingDefaultToolbar.name : '', SettingType.Toolbar, cb.inputEl.parentElement, undefined, 'beforeend');
			});
		ntb.settingsUtils.setFieldPreview(defaultToolbarSetting, existingDefaultToolbar);
	});

	mappingsGroup.addSetting((propertySetting) => {
		propertySetting
			.setName(t('setting.display-rules.option-property'))
			.setDesc(t('setting.display-rules.option-property-description'))
			.addText(text => text
				.setPlaceholder(t('setting.display-rules.option-property-placeholder'))
				.setValue(ntb.settings.toolbarProp)
				.onChange(debounce(async (value) => {
					ntb.settings.toolbarProp = value;
					await ntb.settingsManager.save();
				}, 750)));
	});

	mappingsGroup.addSetting((folderMappingSetting) => {
		folderMappingSetting
			.setName(t('setting.mappings.name'))
			.setDesc(t('setting.mappings.description'));
	});

	const settingItemsEl = containerEl.querySelector('.setting-group .setting-items');
	if (settingItemsEl) {

		const itemsContainerEl = createDiv();
		itemsContainerEl.addClass('note-toolbar-setting-items-list-container');

		if (ntb.settings.folderMappings.length == 0) {

			const emptyMsgEl = createDiv({ text:
				ntb.settingsUtils.emptyMessageFr(
					// eslint-disable-next-line @typescript-eslint/no-misused-promises -- emptyMessageFr callback typed as void; async is intentional
					t('setting.mappings.label-empty'), t('setting.mappings.link-create'), async () => {
					const newMapping = { folder: "", toolbar: "" };
					ntb.settings.folderMappings.push(newMapping);
					await ntb.settingsManager.save();
					state.refresh('.note-toolbar-sortablejs-list > div:last-child input[type="search"]', true);
				}) });
			emptyMsgEl.addClass('note-toolbar-setting-empty-message');

			itemsContainerEl.append(emptyMsgEl);

		}
		else {
			const toolbarFolderListEl = createDiv();
			toolbarFolderListEl.addClass('note-toolbar-sortablejs-list');

			ntb.settings.folderMappings.forEach((mapping) => {
				const rowId = state.itemListIdCounter.toString();
				const toolbarFolderListItemDiv = generateMappingForm(state, mapping, rowId);
				toolbarFolderListEl.append(toolbarFolderListItemDiv);
				state.itemListIdCounter++;
			});

			Sortable.create(toolbarFolderListEl, {
				chosenClass: 'sortable-chosen',
				ghostClass: 'sortable-ghost',
				handle: '.sortable-handle',
				onChange: () => navigator.vibrate(50),
				onChoose: () => navigator.vibrate(50),
				// eslint-disable-next-line @typescript-eslint/no-misused-promises -- SortableJS onSort callback typed as void; async needed to save settings
				onSort: async (item) => {
					ntb.debug("sortable: index: ", item.oldIndex, " -> ", item.newIndex);
					if (item.oldIndex !== undefined && item.newIndex !== undefined) {
						moveElement(ntb.settings.folderMappings, item.oldIndex, item.newIndex);
						await ntb.settingsManager.save();
					}
				}
			});

			itemsContainerEl.appendChild(toolbarFolderListEl);
		}

		settingItemsEl.appendChild(itemsContainerEl);

	//
	// "Add a new mapping" button
	//

	new Setting(settingItemsEl as HTMLElement)
		.setClass('note-toolbar-setting-button')
		.setClass('note-toolbar-setting-no-border')
		.addButton((button: ButtonComponent) => {
			button
				.setTooltip(t('setting.mappings.button-new-tooltip'))
				.setCta()
				.onClick(async () => {
					const newMapping = { folder: "", toolbar: "" };
					ntb.settings.folderMappings.push(newMapping);
					await ntb.settingsManager.save();
					state.refresh('.note-toolbar-sortablejs-list > div:last-child input[type="search"]', true);
				});
			button.buttonEl.setText(iconTextFr('plus', t('setting.mappings.button-new')));
		});

	}

}

function generateMappingForm(state: SettingsTabState, mapping: FolderMapping, rowId: string): HTMLDivElement {

	const { ntb } = state;

	const toolbarFolderListItemDiv = createDiv();
	toolbarFolderListItemDiv.className = "note-toolbar-setting-folder-list-item-container";

	toolbarFolderListItemDiv.setAttribute('data-row-id', rowId);
	const textFieldsDiv = createDiv();
	textFieldsDiv.id = "note-toolbar-setting-item-field-" + state.itemListIdCounter;
	textFieldsDiv.className = "note-toolbar-setting-item-fields";

	new Setting(toolbarFolderListItemDiv)
		.setClass("note-toolbar-setting-item-delete")
		.addButton((cb) => {
			cb.setIcon("minus-circle")
				.setTooltip(t('setting.button-delete-tooltip'))
				.onClick(async () => {
					const btnRowId = cb.buttonEl.getAttribute('data-row-id');
					btnRowId ? state.listMoveHandlerById(null, btnRowId, 'delete') : undefined;
				});
			cb.buttonEl.setAttribute('data-row-id', rowId);
		});

	new Setting(textFieldsDiv)
		.setClass("note-toolbar-setting-mapping-field")
		.addSearch((cb) => {
			new FolderSuggester(state.app, cb.inputEl);
			cb.setPlaceholder(t('setting.mappings.placeholder-folder'))
				.setValue(mapping.folder)
				.onChange(debounce(async (newFolder) => {
					if (
						newFolder &&
						ntb.settings.folderMappings.some(
							(map) => {
								return mapping != map ? map.folder.toLowerCase() === newFolder.toLowerCase() : undefined;
							}
						)
					) {
						if (document.getElementById("note-toolbar-name-error") === null) {
							const errorDiv = createEl("div", {
								text: t('setting.mappings.error-folder-already-mapped'),
								attr: { id: "note-toolbar-name-error" }, cls: "note-toolbar-setting-error-message" });
							toolbarFolderListItemDiv.insertAdjacentElement('afterend', errorDiv);
							toolbarFolderListItemDiv.children[0].addClass("note-toolbar-setting-error");
						}
					}
					else {
						document.getElementById("note-toolbar-name-error")?.remove();
						toolbarFolderListItemDiv.children[0].removeClass("note-toolbar-setting-error");
						mapping.folder = newFolder ? normalizePath(newFolder) : "";
						await ntb.settingsManager.save();
					}
				}, 250));
		});
	new Setting(textFieldsDiv)
		.setClass("note-toolbar-setting-mapping-field")
		.addSearch((cb) => {
			new ToolbarSuggester(ntb, cb.inputEl);
			cb.setPlaceholder(t('setting.mappings.placeholder-toolbar'))
				.setValue(ntb.settingsManager.getToolbarName(mapping.toolbar))
				.onChange(debounce(async (name) => {
					const mappedToolbar = ntb.settingsManager.getToolbarByName(name);
					if (mappedToolbar) {
						mapping.toolbar = mappedToolbar.uuid;
						await ntb.settingsManager.save();
					}
				}, 250));
		});

	const itemHandleDiv = createDiv();
	itemHandleDiv.addClass("note-toolbar-setting-item-controls");
	new Setting(itemHandleDiv)
		.addExtraButton((cb) => {
			cb.setIcon('grip-horizontal')
				.setTooltip(t('setting.button-drag-tooltip'))
				.extraSettingsEl.addClass('sortable-handle');
			cb.extraSettingsEl.setAttribute('data-row-id', state.itemListIdCounter.toString());
			cb.extraSettingsEl.tabIndex = 0;
			ntb.registerDomEvent(
				cb.extraSettingsEl,	'keydown', (e) => {
					const currentEl = e.target as HTMLElement;
					const elRowId = currentEl.getAttribute('data-row-id');
					elRowId ? state.listMoveHandlerById(e, elRowId) : undefined;
				});
		});

	toolbarFolderListItemDiv.append(textFieldsDiv);
	toolbarFolderListItemDiv.append(itemHandleDiv);

	return toolbarFolderListItemDiv;

}
