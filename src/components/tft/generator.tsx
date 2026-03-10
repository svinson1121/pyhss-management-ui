import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';

import {SelectField, InputField} from '@components';
import i18n from '@app/utils/i18n';

// Build an address token: ip selection + optional port range
const AddrField = ({ label, ip, port, onIpChange, onPortChange }: {
  label: string;
  ip: string;
  port: string;
  onIpChange: (v: string) => void;
  onPortChange: (v: string) => void;
}) => (
  <Grid container spacing={1}>
    <Grid item xs={6}>
      <SelectField
        required
        value={ip}
        onChange={(_name, value) => onIpChange(value)}
        id={`${label}_ip`}
        label={`${label} IP`}
        helper=""
      >
        <MenuItem value="any">any</MenuItem>
        <MenuItem value="UE_IP">UE_IP</MenuItem>
      </SelectField>
    </Grid>
    <Grid item xs={6}>
      <InputField
        label={`${label} Port Range`}
        id={`${label}_port`}
        onChange={(_name, value) => onPortChange(value)}
        value={port}
      >e.g. 1-65535 (leave blank for any)</InputField>
    </Grid>
  </Grid>
);

const TftGenerator = (props: {
  onGenerate: Function
}) => {
  const { onGenerate } = props;

  const [action, setAction] = useState('');
  const [direction, setDirection] = useState('');
  const [protocol, setProtocol] = useState('');
  const [srcIp, setSrcIp] = useState('any');
  const [srcPort, setSrcPort] = useState('');
  const [dstIp, setDstIp] = useState('any');
  const [dstPort, setDstPort] = useState('');

  const buildAddr = (ip: string, port: string) => {
    const p = port.trim();
    return p ? `${ip} ${p}` : ip;
  };

  const generateFilter = () => {
    const src = buildAddr(srcIp, srcPort);
    const dst = buildAddr(dstIp, dstPort);
    const filterRule = `${action}${direction ? ' ' + direction : ''} ${protocol} from ${src} to ${dst}`;
    onGenerate(filterRule);
  };

  const clearGenerator = () => {
    setSrcIp('any'); setSrcPort('');
    setDstIp('any'); setDstPort('');
    setDirection(''); setProtocol(''); setAction('');
  };

  return (
    <React.Fragment>
      <Box component="form" noValidate autoComplete="off">
        <Grid container rowSpacing={1} spacing={1}>
          <Grid item xs={12}>&nbsp;</Grid>
          <Grid item xs={10}><h3>TFT Rule Generator</h3></Grid>
          <Grid item xs={2}>
            <Button onClick={clearGenerator}>Clear&nbsp;<i className="fas fa-broom"></i></Button>
            <Button onClick={generateFilter} variant="contained">Generate&nbsp;<i className="fas fa-arrow-up"></i></Button>
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
            <AddrField label="Source" ip={srcIp} port={srcPort} onIpChange={setSrcIp} onPortChange={setSrcPort} />
          </Grid>
          <Grid item xs={12}>
            <AddrField label="Destination" ip={dstIp} port={dstPort} onIpChange={setDstIp} onPortChange={setDstPort} />
          </Grid>
        </Grid>
      </Box>
    </React.Fragment>
  );
};

export default TftGenerator;
