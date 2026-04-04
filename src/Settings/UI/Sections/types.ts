import type NoteToolbarPlugin from "main";
import type { App, ButtonComponent, Menu, Setting } from "obsidian";
import type NoteToolbarSettingTab from "Settings/UI/NoteToolbarSettingTab";

export type SettingsSectionType = 'appToolbars' | 'callouts' | 'contexts' | 'displayRules' | 'itemList' | 'navbar';

export interface SettingsTabState {
	ntb: NoteToolbarPlugin;
	app: App;
	containerEl: HTMLElement;
	settingTab: NoteToolbarSettingTab;
	isSectionOpen: Record<SettingsSectionType, boolean>;
	itemListIdCounter: number;
	refresh: (focusSelector?: string, scrollToFocus?: boolean) => void;
	renderSettingToggle: (
		setting: Setting,
		containerSelector: string,
		section: SettingsSectionType,
		callback?: () => void
	) => void;
	handleSettingToggle: (containerSelector: string, section: SettingsSectionType, callback?: () => void) => void;
	listMoveHandler: (keyEvent: KeyboardEvent | null, index: number, action?: 'up' | 'down' | 'delete') => Promise<void>;
	listMoveHandlerById: (keyEvent: KeyboardEvent | null, rowId: string, action?: 'up' | 'down' | 'delete') => Promise<void>;
	getNavbarVisibilityMenu: (button: ButtonComponent) => Menu;
	updateNavbarVisibilityButton: (button: ButtonComponent) => void;
}
