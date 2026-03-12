import {createSlice} from '@reduxjs/toolkit';
import {
  addWindowClass,
  calculateWindowSize,
  removeWindowClass
} from '@app/utils/helpers';
import {
  NAVBAR_DARK_VARIANTS,
  NAVBAR_LIGHT_VARIANTS,
  SIDEBAR_DARK_SKINS,
  SIDEBAR_LIGHT_SKINS
} from '@app/utils/themes';

export const REFRESH_OPTIONS = [15, 30, 60, 300] as const;
export type RefreshInterval = typeof REFRESH_OPTIONS[number];

export interface UiState {
  screenSize: string;
  menuSidebarCollapsed: boolean;
  controlSidebarCollapsed: boolean;
  darkMode: boolean;
  headerBorder: boolean;
  headerFixed: boolean;
  footerFixed: boolean;
  layoutBoxed: boolean;
  layoutFixed: boolean;
  menuItemFlat: boolean;
  menuChildIndent: boolean;
  navbarVariant: string;
  sidebarSkin: string;
  dashboardRefreshInterval: RefreshInterval;
  metricsEnabled: boolean;
}

const storedRefresh = parseInt(localStorage.getItem('dashboardRefresh') || '15', 10);
const validRefresh = (REFRESH_OPTIONS as readonly number[]).includes(storedRefresh)
  ? storedRefresh as RefreshInterval
  : 15;

// Apply light-mode class on initial load if stored preference is light
if (localStorage.getItem('darkmode') === 'no') {
  document.body.classList.add('light-mode');
}

const initialState: UiState = {
  screenSize: calculateWindowSize(window.innerWidth),
  darkMode: (localStorage.getItem('darkmode')==='yes'?true:false), 
  navbarVariant: 'navbar-light',
  sidebarSkin: (localStorage.getItem('darkmode')==='yes'?'sidebar-dark-olive':'sidebar-light-olive'),
  menuSidebarCollapsed: false,
  controlSidebarCollapsed: true,
  headerBorder: false,
  headerFixed: false,
  footerFixed: true,
  layoutBoxed: false,
  menuItemFlat: false,
  menuChildIndent: false,
  layoutFixed: false,
  dashboardRefreshInterval: validRefresh,
  metricsEnabled: localStorage.getItem('metricsEnabled') !== 'false',
};

addWindowClass('layout-footer-fixed');

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebarMenu: (state) => {
      state.menuSidebarCollapsed = !state.menuSidebarCollapsed;
    },
    toggleControlSidebar: (state) => {
      state.controlSidebarCollapsed = !state.controlSidebarCollapsed;
    },
    toggleHeaderBorder: (state) => {
      state.headerBorder = !state.headerBorder;
    },
    toggleHeaderFixed: (state) => {
      state.headerFixed = !state.headerFixed;
      if (state.headerFixed) {
        addWindowClass('layout-navbar-fixed');
      } else {
        removeWindowClass('layout-navbar-fixed');
      }
    },
    toggleFooterFixed: (state) => {
      state.footerFixed = !state.footerFixed;
      if (state.footerFixed) {
        addWindowClass('layout-footer-fixed');
      } else {
        removeWindowClass('layout-footer-fixed');
      }
    },
    toggleLayoutBoxed: (state) => {
      state.layoutBoxed = !state.layoutBoxed;
      if (state.layoutBoxed) {
        addWindowClass('layout-boxed');
      } else {
        removeWindowClass('layout-boxed');
      }
    },
    toggleLayoutFixed: (state) => {
      state.layoutFixed = !state.layoutFixed;
      if (state.layoutFixed) {
        removeWindowClass('layout-fixed');
      } else {
        addWindowClass('layout-fixed');
      }
    },
    toggleMenuItemFlat: (state) => {
      state.menuItemFlat = !state.menuItemFlat;
    },
    toggleMenuChildIndent: (state) => {
      state.menuChildIndent = !state.menuChildIndent;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      if (state.darkMode) {
        state.navbarVariant = NAVBAR_DARK_VARIANTS[0].value;
        state.sidebarSkin = "sidebar-dark-olive";
        addWindowClass('dark-mode');
        document.body.classList.remove('light-mode');
        localStorage.setItem('darkmode', 'yes');
      } else {
        state.navbarVariant = NAVBAR_LIGHT_VARIANTS[0].value;
        state.sidebarSkin = "sidebar-light-olive";
        localStorage.setItem('darkmode', 'no');
        removeWindowClass('dark-mode');
        document.body.classList.add('light-mode');
      }
    },
    setDarkMode: (state, {payload}) => {
      console.log('setting darkmode', payload);
      state.darkMode = payload;
      if (state.darkMode) {
        state.navbarVariant = NAVBAR_DARK_VARIANTS[0].value;
        state.sidebarSkin = "sidebar-dark-olive";
        addWindowClass('dark-mode');
        document.body.classList.remove('light-mode');
        localStorage.setItem('darkmode', 'yes');
      } else {
        state.navbarVariant = NAVBAR_LIGHT_VARIANTS[0].value;
        state.sidebarSkin = "sidebar-light-olive";
        localStorage.setItem('darkmode', 'no');
        removeWindowClass('dark-mode');
        document.body.classList.add('light-mode');
      }
    },
    setNavbarVariant: (state, {payload}) => {
      if (state.darkMode) {
        state.navbarVariant = payload || NAVBAR_DARK_VARIANTS[0].value;
      } else {
        state.navbarVariant = payload || NAVBAR_LIGHT_VARIANTS[0].value;
      }
    },
    setSidebarSkin: (state, {payload}) => {
      if (state.darkMode) {
        state.sidebarSkin = payload || SIDEBAR_DARK_SKINS[0].value;
      } else {
        state.sidebarSkin = payload || SIDEBAR_LIGHT_SKINS[0].value;
      }
    },
    toggleMetrics: (state) => {
      state.metricsEnabled = !state.metricsEnabled;
      localStorage.setItem('metricsEnabled', String(state.metricsEnabled));
    },
    setDashboardRefresh: (state, {payload}: {payload: RefreshInterval}) => {
      state.dashboardRefreshInterval = payload;
      localStorage.setItem('dashboardRefresh', String(payload));
    },
    setWindowSize: (state, {payload}) => {
      state.screenSize = payload;
    }
  }
});

export const {
  toggleSidebarMenu,
  setWindowSize,
  toggleControlSidebar,
  toggleDarkMode,
  setDarkMode,
  setNavbarVariant,
  setSidebarSkin,
  toggleHeaderBorder,
  toggleHeaderFixed,
  toggleFooterFixed,
  toggleLayoutBoxed,
  toggleMenuItemFlat,
  toggleMenuChildIndent,
  toggleLayoutFixed,
  setDashboardRefresh,
  toggleMetrics,
} = uiSlice.actions;

export default uiSlice.reducer;
