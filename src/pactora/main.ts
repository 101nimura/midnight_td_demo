const w = window as unknown as { __bootStage?: string };
w.__bootStage = 'main.ts 開始';
import '../globals';
import './pactora.css';
import { start } from './app';

// midnight-js 5.0.0 ではネットワーク ID をグローバルに設定せず、プロバイダの config で渡す（wallet.ts）
w.__bootStage = 'モジュール読み込み完了';
start();
w.__bootStage = '画面の描画完了';
