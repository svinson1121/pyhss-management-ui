import React from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import i18n from '@app/utils/i18n';
import {SubscriberAddItem,SaveButtons} from '@components';

import {SubscriberApi, OamApi} from '../../services/pyhss';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  bgcolor: 'var(--bg-card)',
  border: '1px solid #2a3f5c',
  boxShadow: 24,
  p: 4,
};

const SubscriberAddModal = (props: { open: boolean, handleClose: ReturnType<typeof any>, data: ReturnType<typeof Object>, edit: boolean }) => {
  const { open, handleClose, data, edit } = props;
  const [state, setState] = React.useState(data);
  const [error, setError] = React.useState(true);

   React.useEffect(() => {
       setState(data);
   }, [data])

  const handleChange = (name: string, value: string) => {
    setState(prevState => ({
        ...prevState,
        [name]: value
    }));
  };

  const handleLocalClose = () => {
    handleClose();
  }
  const handleSave = async () => {
   if (edit && state.enabled === false && state.imsi) {
    try {
      await OamApi.deregister(state.imsi);
      console.log(`Deregistered IMSI: ${state.imsi}`);
    } catch (err) {
      console.error(`Failed to deregister IMSI: ${state.imsi}`, err);
    }
  }

  const item = {
    "imsi": state.imsi,
    "enabled": state.enabled,
    "roaming_enabled": state.roaming_enabled,
    "roaming_rule_list": state.roaming_rule_list,
    "auc_id": state.auc_id,
    "default_apn": state.default_apn,
    "apn_list": state.apn_list,
    "msisdn": state.msisdn,
    "ue_ambr_dl": state.ue_ambr_dl,
    "ue_ambr_ul": state.ue_ambr_ul,
    "nam": state.nam,
    "subscribed_rau_tau_timer": state.subscribed_rau_tau_timer
  };

    if (edit) {
      SubscriberApi.update(data.subscriber_id, item).then((data) => {
        handleLocalClose();
      });
    } else {
      SubscriberApi.create(item).then((data) => {
        handleLocalClose();
      });
    }
  }

  const handleError = (e: boolean) => {
    setError(e);
  }


  return (
    <React.Fragment>
     <Modal
       open={open}
       onClose={handleLocalClose}
       aria-labelledby="modal-modal-title"
       aria-describedby="modal-modal-description"
     >
       <Box sx={style}>
	<h3>{i18n.t('subscriber.headAdd', {"mode": (edit?i18n.t('generic.edit'):i18n.t('generic.add'))})}</h3>
        <Box
          component="form"
          noValidate
          autoComplete="off"
        >
         <SubscriberAddItem onChange={handleChange} state={state} onError={handleError} edit={edit} />
         </Box>
         <SaveButtons onClickClose={handleLocalClose} onClickSave={handleSave} disabled={error} />
       </Box>
     </Modal>

    </React.Fragment>
  );
}

export default SubscriberAddModal;
