import http from "../http-common";

class SubscriberAttributesApi {
  getBySubscriber(subscriber_id: number) {
    return http.get(`/subscriber_attributes/${subscriber_id}`);
  }

  getAll() {
    return http.get("/subscriber_attributes/list");
  }

  create(data: { subscriber_id: number; key: string; value: string }) {
    return http.put("/subscriber_attributes/", data);
  }

  update(subscriber_attributes_id: number, data: { key: string; value: string }) {
    return http.patch(`/subscriber_attributes/${subscriber_attributes_id}`, data);
  }

  delete(subscriber_attributes_id: number) {
    return http.delete(`/subscriber_attributes/${subscriber_attributes_id}`);
  }
}

export default new SubscriberAttributesApi();
