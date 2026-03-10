import React from 'react';
import { Outlet } from 'react-router-dom';

// Login screen removed — API settings are configured in the settings panel
const PrivateRoute = () => <Outlet />;

export default PrivateRoute;
