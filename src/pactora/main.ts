import '../globals';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { NETWORK_ID } from '../midnight/wallet';
import './pactora.css';
import { start } from './app';

setNetworkId(NETWORK_ID);
start();
