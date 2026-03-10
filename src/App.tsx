import React, { useEffect, useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Main from '@modules/main/Main';
import { useWindowSize } from '@app/hooks/useWindowSize';
import { calculateWindowSize } from '@app/utils/helpers';
import { useDispatch, useSelector } from 'react-redux';
import { setWindowSize, setDarkMode } from '@app/store/reducers/ui';

import Dashboard from '@pages/Dashboard';
import Auc from '@pages/Auc';
import Apn from '@pages/Apn';
import Subscriber from '@pages/Subscriber';
import IMSSubscriber from '@pages/IMSSubscriber';
import Tft from '@pages/Tft';
import ChargingRule from '@pages/ChargingRule';
import RoamingNetwork from '@pages/RoamingNetwork';
import RoamingRule from '@pages/RoamingRule';
import Eir from  '@pages/Eir';

import AddWizard from '@pages/AddWizard';
import Oam from '@pages/Oam';

import PublicRoute from './routes/PublicRoute';
import PrivateRoute from './routes/PrivateRoute';
import { setAuthentication } from './store/reducers/auth';
import {
  getAuthStatus,
} from './utils/oidc-providers';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0a0e14', paper: '#18213a' },
    primary: { main: '#00c8ff', contrastText: '#0a0e14' },
    secondary: { main: '#7a93b8' },
    text: { primary: '#e8f0fe', secondary: '#7a93b8', disabled: '#3d5273' },
    divider: '#1e2d45',
    error: { main: '#ff4757' },
    warning: { main: '#ffc107' },
    success: { main: '#00e676' },
    info: { main: '#00c8ff' },
    action: { hover: 'rgba(0,200,255,0.08)', selected: 'rgba(0,200,255,0.12)' },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none', backgroundColor: '#18213a', border: '1px solid #1e2d45' } } },
    MuiInputBase: { styleOverrides: { root: { backgroundColor: '#141d2b', color: '#e8f0fe' }, input: { color: '#e8f0fe', '&::placeholder': { color: '#3d5273', opacity: 1 } } } },
    MuiOutlinedInput: { styleOverrides: { notchedOutline: { borderColor: '#1e2d45' }, root: { '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2a3f5c' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00c8ff' } } } },
    MuiInputLabel: { styleOverrides: { root: { color: '#7a93b8', '&.Mui-focused': { color: '#00c8ff' } } } },
    MuiSelect: { styleOverrides: { icon: { color: '#7a93b8' } } },
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, borderRadius: '6px' }, containedPrimary: { backgroundColor: '#00c8ff', color: '#0a0e14', '&:hover': { backgroundColor: '#00b8e8' } }, outlined: { borderColor: '#2a3f5c', color: '#7a93b8', '&:hover': { borderColor: '#00c8ff', color: '#00c8ff', backgroundColor: 'rgba(0,200,255,0.08)' } } } },
    MuiTableCell: { styleOverrides: { root: { borderBottomColor: '#1e2d45', color: '#e8f0fe' }, head: { backgroundColor: '#141d2b', color: '#3d5273', borderBottomColor: '#2a3f5c' } } },
    MuiTableRow: { styleOverrides: { root: { '&:hover': { backgroundColor: '#1e2a3f' } } } },
    MuiCheckbox: { styleOverrides: { root: { color: '#2a3f5c', '&.Mui-checked': { color: '#00c8ff' } } } },
    MuiDivider: { styleOverrides: { root: { borderColor: '#1e2d45' } } },
    MuiTypography: { styleOverrides: { root: { color: '#e8f0fe' }, h6: { color: '#7a93b8' } } },
    MuiIconButton: { styleOverrides: { root: { color: '#3d5273', '&:hover': { color: '#00c8ff', backgroundColor: 'rgba(0,200,255,0.08)' } } } },
    MuiMenuItem: { styleOverrides: { root: { color: '#e8f0fe', '&:hover': { backgroundColor: '#1e2a3f' }, '&.Mui-selected': { backgroundColor: 'rgba(0,200,255,0.12)', color: '#00c8ff' } } } },
  },
  typography: { fontFamily: "'Inter', sans-serif" },
});

const lightTheme = darkTheme;

const App = () => {
  const windowSize = useWindowSize();
  const screenSize = useSelector((state: any) => state.ui.screenSize);
  const dispatch = useDispatch();
  const [isAppLoading, setIsAppLoading] = useState(true);

  const checkSession = async () => {
    try {
      let responses: any = await Promise.all([
        getAuthStatus(),
      ]);

      responses = responses.filter((r: any) => Boolean(r));

      if (responses && responses.length > 0) {
        dispatch(setAuthentication(responses[0]));
      }
    } catch (error: any) {
      console.log('error', error);
    }
    setIsAppLoading(false);
  };

  useEffect(() => {
    dispatch(setDarkMode((localStorage.getItem('darkmode')==='yes'?true:false)));
    checkSession();
  }, []);

  useEffect(() => {
    const size = calculateWindowSize(windowSize.width);
    if (screenSize !== size) {
      dispatch(setWindowSize(size));
    }
  }, [windowSize]);

  const darkMode = useSelector(
    (state: any) => state.ui.darkMode
  );

  if (isAppLoading) {
    return <p>Loading</p>;
  }

  return (
  <ThemeProvider theme={(darkMode?darkTheme:lightTheme)}>
    <BrowserRouter>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<PrivateRoute />}>
          <Route path="/" element={<Main />}>
            <Route path="/apn" element={<Apn />} />
            <Route path="/auc" element={<Auc />} />
            <Route path="/subscriber" element={<Subscriber />} />
            <Route path="/imssubscriber" element={<IMSSubscriber />} />
            <Route path="/tft" element={<Tft />} />
            <Route path="/chargingrule" element={<ChargingRule />} />
	    <Route path="/eir" element={<Eir />} />
            <Route path="/roamingnetwork" element={<RoamingNetwork />} />
            <Route path="/roamingrule" element={<RoamingRule />} />
            <Route path="/oam" element={<Oam />} />
            <Route path="/addwizard" element={<AddWizard />} />
            <Route path="/" element={<Dashboard />} />
          </Route>
        </Route>
      </Routes>
      <ToastContainer
        autoClose={3000}
        draggable={false}
        position="top-right"
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnHover
      />
    </BrowserRouter>
  </ThemeProvider>
  );
};

export default App;
