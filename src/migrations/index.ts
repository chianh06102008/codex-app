import * as migration_20261114_100802_standalone_initial from './20261114_100802_standalone_initial';

export const migrations = [
  {
    up: migration_20261114_100802_standalone_initial.up,
    down: migration_20261114_100802_standalone_initial.down,
    name: '20261114_100802_standalone_initial'
  },
];
