import { useEffect, useEffectEvent, useMemo, useState } from "react";

import { api } from "../lib/api";

export function useIncidentStream() {
  const [status, setStatus] = useState("connecting");
  const [latestIncident, setLatestIncident] = useState(null);
  const [events, setEvents] = useState([]);

  const pushEvent = useEffectEvent((event) => {
    if (event.type === "SNAPSHOT") {
      setEvents(event.events ?? []);
      return;
    }
    if (event.type === "NEW_INCIDENT" && event.incident) {
      setLatestIncident(event.incident);
    }
    setEvents((previous) => [event, ...previous].slice(0, 50));
  });

  useEffect(() => {
    const socket = new WebSocket(api.wsUrl);

    socket.onopen = () => {
      setStatus("connected");
      socket.send("ping");
    };

    socket.onmessage = (message) => {
      const parsed = JSON.parse(message.data);
      pushEvent(parsed);
    };

    socket.onerror = () => setStatus("error");
    socket.onclose = () => setStatus("disconnected");

    return () => socket.close();
  }, []);

  return useMemo(
    () => ({
      status,
      latestIncident,
      events,
      clearLatestIncident: () => setLatestIncident(null),
    }),
    [events, latestIncident, status],
  );
}
