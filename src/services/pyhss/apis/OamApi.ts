import http from "../http-common";

class OamApi {
  reconcile(imsi: string) {
    return http.get(`/oam/reconcile/imsi/${imsi}`);
  }
  deregister(imsi: string) {
    return http.get(`/oam/deregister/${imsi}`);
  }
  servingSubs() {
    return http.get("/oam/serving_subs");
  }
  servingSubsIms() {
    return http.get("/oam/serving_subs_ims");
  }
  servingSubsPcrf() {
    return http.get("/oam/serving_subs_pcrf");
  }
  diameterPeers() {
    return http.get("/oam/diameter_peers");
  }
  ping() {
    return http.get("/oam/ping");
  }
  operationLogs(page = 0, pageSize = 20) {
    return http.get(`/operation_logs/list?page=${page}&page_size=${pageSize}`);
  }
  operationLogsLast() {
    return http.get("/operation_logs/last");
  }
  operationLogsByTable(table: string, page = 0, pageSize = 20) {
    return http.get(`/operation_logs/list/table/${table}?page=${page}&page_size=${pageSize}`);
  }
  rollbackLast() {
    return http.get("/oam/rollback_operation/last");
  }
  rollback(operationId: string) {
    return http.get(`/oam/rollback_operation/${operationId}`);
  }
  georedPeers() {
    return http.get("/geored/peers");
  }
}

export default new OamApi();
