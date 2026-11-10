'use client';

import { useSyncExternalStore } from 'react';
import moment from 'moment';

function subscribe(callback: () => void) {
    const interval = window.setInterval(callback, 60_000);
    return () => window.clearInterval(interval);
}

function getSnapshot() {
    return moment().format('YYYY-MM-DDTHH:mm');
}

function getServerSnapshot() {
    return '';
}

export function useLocalDateTime() {
    const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    return value ? moment(value, 'YYYY-MM-DDTHH:mm', true) : null;
}
