import NoteToolbarPlugin from "main";
import { App, ButtonComponent, Setting } from "obsidian";
import type NoteToolbarSettingTab from "Settings/UI/NoteToolbarSettingTab";

export type SettingsSectionType = 'appToolbars' | 'callouts' | 'contexts' | 'displayRules' | 'itemList' | 'navbar';

export interface SettingsTabState {
	ntb: NoteToolbarPlugin;
	app: App;
	containerEl: HTMLElement;
	/** The actual NoteToolbarSettingTab instance, for APIs that require it */
	settingTab: NoteToolbarSettingTab;
	isSectionOpen: Record<SettingsSectionType, boolean>;
	itemListIdCounter: number;
	/** Call to re-render the settings tab, optionally focusing an element */
	refresh: (focusSelector?: string, scrollToFocus?: boolean) => void;
	/** Renders a collapsible toggle on a setting heading */
	renderSettingToggle: (
		setting: Setting,
		containerSelector: string,
		section: SettingsSectionType,
		callback?: () => void
	) => void;
	/** Handles the actual toggle logic */
	handleSettingToggle: (containerSelector: string, section: SettingsSectionType, callback?: () => void) => void;
	/** Handles moving mappings in the list */
	listMoveHandler: (keyEvent: KeyboardEvent | null, index: number, action?: 'up' | 'down' | 'delete') => Promise<void>;
	/** Handles moving mappings by row ID */
	listMoveHandlerById: (keyEvent: KeyboardEvent | null, rowId: string, action?: 'up' | 'down' | 'delete') => Promise<void>;
	/** Gets the navbar visibility menu */
	getNavbarVisibilityMenu: (button: ButtonComponent) => import("obsidian").Menu;
	/** Updates navbar visibility button icon/tooltip */
	updateNavbarVisibilityButton: (button: ButtonComponent) => void;
}
