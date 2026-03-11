import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';

import {SelectField, InputField} from '@components';

// Resolve the stored IP token from the dropdown + optional custom CIDR input
const resolveIp = (mode: string, custom: string): string => {
  if (mode === '{{UE_IP}}') return '{{UE_IP}}';
  if (mode === 'custom')    return custom.trim() || 'any';
  return 'any';
};

const buildAddr = (ip: string, port: string): string =>
  port.trim() ? `${ip} ${port.trim()}` : ip;

// Source/Destination field: dropdown + optional CIDR input + port range
const AddrField = ({ label, mode, custom, port, onModeChange, onCustomChange, onPortChange }: {
  label: string;
  mode: string;
  custom: string;
  port: string;
  onModeChange: (v: string) => void;
  onCustomChange: (v: string) => void;
  onPortChange: (v: string) => void;
}) => (
  <Grid container spacing={1} alignItems="flex-start">
    <Grid item xs={12}>
      <strong style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: "'IBM Plex Mono', monospace" }}>
        {label}
      </strong>
    </Grid>
    <Grid item xs={mode === 'custom' ? 4 : 6}>
      <SelectField
        required
        value={mode}
        onChange={(_name, value) => onModeChange(value)}
        id={`${label}_mode`}
        label={`${label} IP`}
        helper=""
      >
        <MenuItem value="any">any</MenuItem>
        <MenuItem value="{{UE_IP}}">{'{{UE_IP}}'} — subscriber address</MenuItem>
        <MenuItem value="custom">Custom IP / CIDR</MenuItem>
      </SelectField>
    </Grid>
    {mode === 'custom' && (
      <Grid item xs={4}>
        <InputField
          required
          label="IP / CIDR"
          id={`${label}_cidr`}
          onChange={(_name, value) => onCustomChange(value)}
          value={custom}
        >e.g. 10.0.0.0/8 or 192.168.1.1</InputField>
      </Grid>
    )}
    <Grid item xs={mode === 'custom' ? 4 : 6}>
      <InputField
        label={`${label} Port Range`}
        id={`${label}_port`}
        onChange={(_name, value) => onPortChange(value)}
        value={port}
      >e.g. 80 or 1024-65535 (blank = any)</InputField>
    </Grid>
  </Grid>
);

const TftGenerator = (props: { onGenerate: Function }) => {
  const { onGenerate } = props;

  const [action,    setAction]    = useState('permit');
  const [direction, setDirection] = useState('');
  const [protocol,  setProtocol]  = useState('ip');

  const [srcMode,   setSrcMode]   = useState('any');
  const [srcCustom, setSrcCustom] = useState('');
  const [srcPort,   setSrcPort]   = useState('');

  const [dstMode,   setDstMode]   = useState('any');
  const [dstCustom, setDstCustom] = useState('');
  const [dstPort,   setDstPort]   = useState('');

  const generateFilter = () => {
    const src = buildAddr(resolveIp(srcMode, srcCustom), srcPort);
    const dst = buildAddr(resolveIp(dstMode, dstCustom), dstPort);
    const rule = `${action}${direction ? ' ' + direction : ''} ${protocol} from ${src} to ${dst}`;
    onGenerate(rule);
  };

  const clearGenerator = () => {
    setAction('permit'); setDirection(''); setProtocol('ip');
    setSrcMode('any'); setSrcCustom(''); setSrcPort('');
    setDstMode('any'); setDstCustom(''); setDstPort('');
  };

  return (
    <React.Fragment>
      <Box component="form" noValidate autoComplete="off">
        <Grid container rowSpacing={1} spacing={1}>
          <Grid item xs={12}>&nbsp;</Grid>
          <Grid item xs={10}><h3>TFT Rule Generator</h3></Grid>
          <Grid item xs={2}>
            <Button onClick={clearGenerator}>Clear&nbsp;<i className="fas fa-broom" /></Button>
            <Button onClick={generateFilter} variant="contained">Generate&nbsp;<i className="fas fa-arrow-up" /></Button>
          </Grid>

          <Grid item xs={3}>
            <SelectField required value={action} onChange={(_n, v) => setAction(v)} id="action" label="Action" helper="">
              <MenuItem value="permit">permit</MenuItem>
              <MenuItem value="deny">deny</MenuItem>
            </SelectField>
          </Grid>
          <Grid item xs={3}>
            <SelectField required value={direction} onChange={(_n, v) => setDirection(v)} id="direction" label="Direction" helper="">
              <MenuItem value="">any</MenuItem>
              <MenuItem value="in">in</MenuItem>
              <MenuItem value="out">out</MenuItem>
            </SelectField>
          </Grid>
          <Grid item xs={3}>
            <SelectField required value={protocol} onChange={(_n, v) => setProtocol(v)} id="protocol" label="Protocol" helper="">
              <MenuItem value="ip">ip (any)</MenuItem>
              <MenuItem value="6">tcp</MenuItem>
              <MenuItem value="17">udp</MenuItem>
              <MenuItem value="1">icmp</MenuItem>
            </SelectField>
          </Grid>

          <Grid item xs={12}>
            <AddrField
              label="Source"
              mode={srcMode}   custom={srcCustom}   port={srcPort}
              onModeChange={setSrcMode} onCustomChange={setSrcCustom} onPortChange={setSrcPort}
            />
          </Grid>
          <Grid item xs={12}>
            <AddrField
              label="Destination"
              mode={dstMode}   custom={dstCustom}   port={dstPort}
              onModeChange={setDstMode} onCustomChange={setDstCustom} onPortChange={setDstPort}
            />
          </Grid>
        </Grid>
      </Box>
    </React.Fragment>
  );
};

export default TftGenerator;
