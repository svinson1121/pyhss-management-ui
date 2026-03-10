import React from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { NavLink } from 'react-router-dom';
import Button from '@mui/material/Button';
import { DeleteDialog } from '@components';
import { SubscriberAttributesApi } from '../../services/pyhss';
import i18n from '@app/utils/i18n';

interface Attribute {
  subscriber_attributes_id: number;
  subscriber_id: number;
  key: string;
  value: string;
}

// Attribute count pill shown in the table row
const AttrPill = ({ count }: { count: number | null }) => {
  if (!count) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px', borderRadius: 10,
      fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
      background: 'rgba(0,200,255,0.12)', color: 'var(--accent)',
      border: '1px solid rgba(0,200,255,0.3)', marginLeft: 8,
    }}>
      <i className="fas fa-tags" style={{ fontSize: 8 }} />
      {count}
    </span>
  );
};

// Single existing attribute row with inline edit
const AttrRow = ({ attr, onSave, onDelete }: {
  attr: Attribute;
  onSave: (id: number, key: string, value: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) => {
  const [editing, setEditing] = React.useState(false);
  const [key, setKey] = React.useState(attr.key);
  const [value, setValue] = React.useState(attr.value);
  const [saving, setSaving] = React.useState(false);

  const doSave = async () => {
    setSaving(true);
    await onSave(attr.subscriber_attributes_id, key, value);
    setSaving(false);
    setEditing(false);
  };

  const doCancel = () => { setKey(attr.key); setValue(attr.value); setEditing(false); };

  if (editing) {
    return (
      <TableRow style={{ background: 'rgba(0,200,255,0.04)' }}>
        <TableCell style={S.td}>
          <input style={S.input} value={key} onChange={e => setKey(e.target.value)} placeholder="Key" autoFocus />
        </TableCell>
        <TableCell style={S.td}>
          <input style={S.input} value={value} onChange={e => setValue(e.target.value)} placeholder="Value"
            onKeyDown={e => { if (e.key === 'Enter') doSave(); if (e.key === 'Escape') doCancel(); }} />
        </TableCell>
        <TableCell style={{ ...S.td, whiteSpace: 'nowrap' }}>
          <button onClick={doSave} disabled={saving} style={S.btnSave}>
            {saving ? <i className="fas fa-circle-notch fa-spin" /> : <><i className="fas fa-check" style={{ marginRight: 4 }} />Save</>}
          </button>
          <button onClick={doCancel} style={S.btnCancel}><i className="fas fa-times" style={{ marginRight: 4 }} />Cancel</button>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow style={S.attrRow}>
      <TableCell style={{ ...S.td, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
        {attr.key}
      </TableCell>
      <TableCell style={{ ...S.td, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: 'var(--text-primary)' }}>
        {attr.value}
      </TableCell>
      <TableCell style={{ ...S.td, whiteSpace: 'nowrap' }}>
        <button onClick={() => setEditing(true)} style={S.btnEdit} title="Edit"><i className="fas fa-pen" /></button>
        <button onClick={() => onDelete(attr.subscriber_attributes_id)} style={S.btnDelete} title="Delete"><i className="fas fa-trash" /></button>
      </TableCell>
    </TableRow>
  );
};

// Inline new-attribute form appended at the bottom of the table
const NewAttrRow = ({ subscriberId, onCreated }: {
  subscriberId: number;
  onCreated: (attr: Attribute) => void;
}) => {
  const [open, setOpen] = React.useState(false);
  const [key, setKey] = React.useState('');
  const [value, setValue] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const doCreate = async () => {
    if (!key.trim()) return;
    setSaving(true);
    try {
      const res = await SubscriberAttributesApi.create({ subscriber_id: subscriberId, key: key.trim(), value: value.trim() });
      onCreated(res.data);
      setKey(''); setValue(''); setOpen(false);
    } finally { setSaving(false); }
  };

  const doCancel = () => { setOpen(false); setKey(''); setValue(''); };

  if (!open) {
    return (
      <TableRow>
        <TableCell colSpan={3} style={{ border: 'none', paddingTop: 6 }}>
          <button onClick={() => setOpen(true)} style={S.btnAdd}>
            <i className="fas fa-plus" style={{ marginRight: 6 }} />Add Attribute
          </button>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow style={{ background: 'rgba(0,230,118,0.04)', borderTop: '1px dashed rgba(0,230,118,0.25)' }}>
      <TableCell style={S.td}>
        <input style={{ ...S.input, borderColor: 'rgba(0,230,118,0.4)' }}
          value={key} onChange={e => setKey(e.target.value)} placeholder="Key" autoFocus />
      </TableCell>
      <TableCell style={S.td}>
        <input style={{ ...S.input, borderColor: 'rgba(0,230,118,0.4)' }}
          value={value} onChange={e => setValue(e.target.value)} placeholder="Value"
          onKeyDown={e => { if (e.key === 'Enter') doCreate(); if (e.key === 'Escape') doCancel(); }} />
      </TableCell>
      <TableCell style={{ ...S.td, whiteSpace: 'nowrap' }}>
        <button onClick={doCreate} disabled={saving || !key.trim()}
          style={{ ...S.btnSave, background: 'rgba(0,230,118,0.12)', color: 'var(--accent-green)', borderColor: 'rgba(0,230,118,0.3)' }}>
          {saving ? <i className="fas fa-circle-notch fa-spin" /> : <><i className="fas fa-check" style={{ marginRight: 4 }} />Create</>}
        </button>
        <button onClick={doCancel} style={S.btnCancel}><i className="fas fa-times" style={{ marginRight: 4 }} />Cancel</button>
      </TableCell>
    </TableRow>
  );
};

// Main subscriber table row
const SubscriberItem = (props: {
  row: ReturnType<typeof Object>;
  deleteCallback: ReturnType<typeof any>;
  openEditCallback: ReturnType<typeof any>;
}) => {
  const { row, deleteCallback, openEditCallback } = props;
  const [open, setOpen] = React.useState(false);
  const [attrs, setAttrs] = React.useState<Attribute[] | null>(null);

  // Fetch on mount for the pill count
  React.useEffect(() => {
    SubscriberAttributesApi.getBySubscriber(row.subscriber_id)
      .then(d => setAttrs(Array.isArray(d.data) ? d.data : []))
      .catch(() => setAttrs([]));
  }, [row.subscriber_id]);

  const handleAttrDelete = async (id: number) => {
    await SubscriberAttributesApi.delete(id);
    setAttrs(prev => (prev ?? []).filter(a => a.subscriber_attributes_id !== id));
  };

  const handleAttrSave = async (id: number, key: string, value: string) => {
    await SubscriberAttributesApi.update(id, { key, value });
    setAttrs(prev => (prev ?? []).map(a => a.subscriber_attributes_id === id ? { ...a, key, value } : a));
  };

  const handleAttrCreated = (attr: Attribute) => {
    setAttrs(prev => [...(prev ?? []), attr]);
  };

  const attrCount = attrs ? attrs.length : null;
  const hasAttrs = !!attrCount;

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(o => !o)}
            sx={hasAttrs ? {
              color: 'var(--accent)',
              filter: 'drop-shadow(0 0 4px rgba(0,200,255,0.55))',
              '&:hover': { filter: 'drop-shadow(0 0 8px rgba(0,200,255,0.85))' },
            } : {}}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">{row.imsi}</TableCell>
        <TableCell>
          <Button component={NavLink} to={`/auc?auc=${row.auc_id}`} variant="outlined">{row.auc_id}</Button>
        </TableCell>
        <TableCell>{row.enabled ? i18n.t('generic.yes') : i18n.t('generic.no')}</TableCell>
        <TableCell>
          {row.msisdn}
          <AttrPill count={attrCount} />
        </TableCell>
        <TableCell>{row.ue_ambr_dl}</TableCell>
        <TableCell>{row.ue_ambr_ul}</TableCell>
        <TableCell>{row.subscribed_rau_tau_timer}</TableCell>
        <TableCell>
          <Button onClick={() => openEditCallback(row)}><i className="fas fa-edit" /></Button>
          <DeleteDialog id={row.subscriber_id} callback={deleteCallback} />
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>

            {/* MME Details */}
            <Box sx={{ margin: 1, marginBottom: 2 }}>
              <Typography variant="h6" gutterBottom component="div">
                {i18n.t('generic.details')}
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{i18n.t('generic.timestamp')}</TableCell>
                    <TableCell>{i18n.t('subscriber.mme')}</TableCell>
                    <TableCell>{i18n.t('subscriber.realm')}</TableCell>
                    <TableCell>{i18n.t('subscriber.peer')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell style={{ whiteSpace: 'nowrap' }}>{row.serving_mme_timestamp}</TableCell>
                    <TableCell>{row.serving_mme}</TableCell>
                    <TableCell>{row.serving_mme_realm}</TableCell>
                    <TableCell>{String(row.serving_mme_peer).replace(';', '\n')}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>

            {/* Attributes */}
            <Box sx={{ margin: 1, marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Typography variant="h6" component="div" style={{ margin: 0 }}>
                  Attributes
                </Typography>
                {hasAttrs && (
                  <span style={{
                    fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
                    color: 'var(--accent)', background: 'rgba(0,200,255,0.10)',
                    border: '1px solid rgba(0,200,255,0.25)',
                    padding: '1px 7px', borderRadius: 8,
                  }}>
                    {attrCount} stored
                  </span>
                )}
              </div>
              <Table size="small" style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 6, overflow: 'hidden' }}>
                <TableHead>
                  <TableRow style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <TableCell style={S.th}>Key</TableCell>
                    <TableCell style={S.th}>Value</TableCell>
                    <TableCell style={{ ...S.th, width: 140 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attrs === null ? (
                    <TableRow>
                      <TableCell colSpan={3} style={{ ...S.td, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <i className="fas fa-circle-notch fa-spin" style={{ marginRight: 8 }} />Loading…
                      </TableCell>
                    </TableRow>
                  ) : attrs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} style={{ ...S.td, textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 12 }}>
                        No attributes yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    attrs.map(attr => (
                      <AttrRow key={attr.subscriber_attributes_id} attr={attr} onSave={handleAttrSave} onDelete={handleAttrDelete} />
                    ))
                  )}
                  <NewAttrRow subscriberId={row.subscriber_id} onCreated={handleAttrCreated} />
                </TableBody>
              </Table>
            </Box>

          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

const S: Record<string, React.CSSProperties> = {
  th: {
    fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
    color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase',
    padding: '8px 12px',
  },
  td: { padding: '8px 12px', color: 'var(--text-secondary)', verticalAlign: 'middle' },
  attrRow: { borderBottom: '1px solid rgba(255,255,255,0.04)' },
  input: {
    width: '100%', background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(0,200,255,0.25)', borderRadius: 4,
    color: 'var(--text-primary)', padding: '5px 8px',
    fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: 'none',
  },
  btnSave: {
    padding: '4px 10px', borderRadius: 4, cursor: 'pointer', marginRight: 4,
    fontSize: 11, fontFamily: "'IBM Plex Mono', monospace",
    background: 'rgba(0,200,255,0.12)', color: 'var(--accent)',
    border: '1px solid rgba(0,200,255,0.3)',
  },
  btnCancel: {
    padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
    fontSize: 11, fontFamily: "'IBM Plex Mono', monospace",
    background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  btnEdit: {
    padding: '4px 8px', borderRadius: 4, cursor: 'pointer', marginRight: 4,
    fontSize: 11, background: 'rgba(0,200,255,0.08)',
    color: 'var(--accent)', border: '1px solid rgba(0,200,255,0.2)',
  },
  btnDelete: {
    padding: '4px 8px', borderRadius: 4, cursor: 'pointer',
    fontSize: 11, background: 'rgba(255,71,87,0.08)',
    color: 'var(--accent-red)', border: '1px solid rgba(255,71,87,0.2)',
  },
  btnAdd: {
    padding: '5px 12px', borderRadius: 4, cursor: 'pointer',
    fontSize: 11, fontFamily: "'IBM Plex Mono', monospace",
    background: 'rgba(0,200,255,0.07)', color: 'var(--accent)',
    border: '1px dashed rgba(0,200,255,0.3)',
    display: 'inline-flex', alignItems: 'center',
  },
};

export default SubscriberItem;
