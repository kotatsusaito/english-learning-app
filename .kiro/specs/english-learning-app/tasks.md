# Implementation Plan: English Learning App

## Overview

本実装計画では、AIとの対話を通じて英語学習を支援するWebアプリケーションを構築します。TypeScriptを使用し、フロントエンドとバックエンドを分離したアーキテクチャで実装します。各タスクは段階的に機能を構築し、プロパティベーステストとユニットテストで品質を保証します。

## Tasks

- [x] 1. プロジェクト構造とコア型定義のセットアップ
  - TypeScriptプロジェクトの初期化（フロントエンドとバックエンド）
  - 共通の型定義ファイルを作成（Session, ConversationTurn, Correction, UserResponse, AudioData）
  - テストフレームワークのセットアップ（Jest, fast-check）
  - 基本的なディレクトリ構造の作成
  - _Requirements: 全体的な基盤_

- [ ] 2. バックエンド: SessionManager実装
  - [x] 2.1 SessionManagerクラスの実装
    - セッション作成、取得、終了機能
    - 会話履歴の管理機能
    - メモリ内ストレージの実装
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 2.2 SessionManagerのプロパティテスト
    - **Property 11: Conversation Context Preservation**
    - **Validates: Requirements 6.2**

  - [ ]* 2.3 SessionManagerのユニットテスト
    - セッション作成のテスト
    - 無効なセッションIDの処理テスト
    - _Requirements: 6.1, 6.4_

- [ ] 3. バックエンド: AIServiceAdapter実装
  - [x] 3.1 AIServiceAdapterインターフェースと実装
    - OpenAI/Claude APIクライアントの統合
    - 質問生成メソッドの実装
    - 回答分析と校正メソッドの実装
    - プロンプトテンプレートの実装
    - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3_

  - [ ]* 3.2 質問生成のプロパティテスト
    - **Property 1: Question Generation Consistency**
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 3.3 文法分析のプロパティテスト
    - **Property 6: Grammar Analysis Execution**
    - **Validates: Requirements 4.1**

  - [ ]* 3.4 AIServiceAdapterのユニットテスト
    - API呼び出し失敗時のエラーハンドリング
    - タイムアウト処理のテスト
    - _Requirements: 7.1, 7.2_

- [ ] 4. バックエンド: SpeechService実装
  - [x] 4.1 SpeechServiceインターフェースと実装
    - テキスト音声合成機能の実装
    - OpenAI TTS APIまたはWeb Speech APIの統合
    - 音声データの生成とURL管理
    - _Requirements: 5.1, 5.2_

  - [ ]* 4.2 音声合成のプロパティテスト
    - **Property 9: Speech Synthesis for Corrections**
    - **Validates: Requirements 5.1**

  - [ ]* 4.3 SpeechServiceのユニットテスト
    - 音声合成失敗時のエラーハンドリング
    - サポートされていない形式の処理
    - _Requirements: 5.5, 7.3_

- [x] 5. Checkpoint - バックエンドコア機能の確認
  - すべてのバックエンドテストが通ることを確認してください。質問があれば聞いてください。

- [ ] 6. バックエンド: API Endpoints実装
  - [x] 6.1 Express/Fastifyサーバーのセットアップ
    - サーバーフレームワークの初期化
    - ミドルウェアの設定（CORS, JSON parser, エラーハンドラ）
    - _Requirements: 全体的な基盤_

  - [x] 6.2 セッション管理エンドポイント
    - POST /api/sessions - セッション作成
    - GET /api/sessions/:id - セッション取得
    - DELETE /api/sessions/:id - セッション終了
    - _Requirements: 6.1, 6.3, 6.4_

  - [x] 6.3 質問と回答エンドポイント
    - POST /api/sessions/:id/question - 質問生成
    - POST /api/sessions/:id/response - 回答送信と校正
    - _Requirements: 1.1, 1.2, 2.3, 4.1, 4.2_

  - [x] 6.4 音声合成エンドポイント
    - POST /api/speech/synthesize - 音声生成
    - _Requirements: 5.1_

  - [ ]* 6.5 APIエンドポイントの統合テスト
    - 各エンドポイントの正常系テスト
    - エラーレスポンスのテスト
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 7. バックエンド: エラーハンドリングとロギング
  - [x] 7.1 エラーハンドリングミドルウェアの実装
    - グローバルエラーハンドラ
    - エラーメッセージのフォーマット
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 7.2 ロギングシステムの実装
    - エラーログの記録
    - リクエスト/レスポンスのログ
    - _Requirements: 7.4_

  - [ ]* 7.3 エラーハンドリングのプロパティテスト
    - **Property 13: Error Logging Completeness**
    - **Validates: Requirements 7.4**

  - [ ]* 7.4 データ保持のプロパティテスト
    - **Property 14: Data Preservation During Recoverable Errors**
    - **Validates: Requirements 7.5**

- [x] 8. Checkpoint - バックエンド完成確認
  - すべてのバックエンドテストが通ることを確認してください。質問があれば聞いてください。

- [ ] 9. フロントエンド: プロジェクトセットアップとコアコンポーネント
  - [x] 9.1 React/Vue/Svelteプロジェクトの初期化
    - フロントエンドフレームワークのセットアップ
    - TypeScript設定
    - APIクライアントの作成
    - _Requirements: 全体的な基盤_

  - [x] 9.2 APIクライアントサービスの実装
    - バックエンドAPIとの通信ロジック
    - エラーハンドリング
    - _Requirements: 全体的な基盤_

- [ ] 10. フロントエンド: QuestionDisplayコンポーネント
  - [x] 10.1 QuestionDisplayコンポーネントの実装
    - 質問テキストの表示
    - ローディング状態の表示
    - エラーメッセージの表示
    - _Requirements: 1.1, 1.2_

  - [ ]* 10.2 QuestionDisplayのユニットテスト
    - 質問表示のテスト
    - ローディング状態のテスト
    - _Requirements: 1.1_

- [ ] 11. フロントエンド: ResponseInputコンポーネント
  - [x] 11.1 ResponseInputコンポーネントの実装
    - テキスト入力フィールド
    - リアルタイム表示
    - 送信ボタンとハンドラ
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 11.2 入力表示同期のプロパティテスト
    - **Property 3: Input Display Synchronization**
    - **Validates: Requirements 2.2**

  - [ ]* 11.3 ResponseInputのユニットテスト
    - 入力値の取得テスト
    - クリア機能のテスト
    - _Requirements: 2.1, 2.3_

- [ ] 12. フロントエンド: CorrectionDisplayコンポーネント
  - [x] 12.1 CorrectionDisplayコンポーネントの実装
    - 元の回答と校正結果の並列表示
    - 説明文の表示
    - 正しい回答の場合の表示
    - _Requirements: 3.1, 3.2, 3.3, 4.4, 4.5_

  - [ ]* 12.2 元の回答表示のプロパティテスト
    - **Property 5: Original Response Visibility**
    - **Validates: Requirements 3.1, 3.3**

  - [ ]* 12.3 デュアル表示のプロパティテスト
    - **Property 8: Dual Display of Original and Corrected**
    - **Validates: Requirements 4.4**

  - [ ]* 12.4 CorrectionDisplayのユニットテスト
    - 校正なしの場合の表示テスト
    - クリア機能のテスト
    - _Requirements: 4.5_

- [ ] 13. フロントエンド: AudioPlayerコンポーネント
  - [x] 13.1 AudioPlayerコンポーネントの実装
    - 音声の読み込みと再生
    - 再生/停止ボタン
    - 再生状態の管理
    - _Requirements: 5.3, 5.4_

  - [ ]* 13.2 音声再生のプロパティテスト
    - **Property 10: Audio Replay Capability**
    - **Validates: Requirements 5.4**

  - [ ]* 13.3 AudioPlayerのユニットテスト
    - 音声読み込みのテスト
    - 再生/停止のテスト
    - _Requirements: 5.3, 5.4_

- [ ] 14. フロントエンド: メインアプリケーションの統合
  - [x] 14.1 メインアプリケーションコンポーネントの実装
    - すべてのコンポーネントの統合
    - 学習セッションのワークフロー管理
    - 状態管理（セッションID、会話履歴）
    - _Requirements: 6.1, 6.2_

  - [x] 14.2 エラーハンドリングUIの実装
    - エラーメッセージの表示
    - リトライボタン
    - グレースフルデグラデーション（音声なしでも動作）
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [ ]* 14.3 セッション作成のプロパティテスト
    - **Property 12: Session Creation Availability**
    - **Validates: Requirements 6.4**

  - [ ]* 14.4 回答永続化のプロパティテスト
    - **Property 4: Response Persistence Round-Trip**
    - **Validates: Requirements 2.3, 3.2**

- [x] 15. Checkpoint - フロントエンド完成確認
  - すべてのフロントエンドテストが通ることを確認してください。質問があれば聞いてください。

- [ ] 16. エンドツーエンド統合とプロパティテスト
  - [x] 16.1 質問タイプ多様性のプロパティテスト
    - **Property 2: Question Type Diversity**
    - **Validates: Requirements 1.4**
    - フロントエンドとバックエンドを統合してテスト

  - [x] 16.2 校正生成のプロパティテスト
    - **Property 7: Correction Generation for Errors**
    - **Validates: Requirements 4.2**
    - エラーを含む回答に対する校正生成をテスト

  - [ ]* 16.3 エンドツーエンド統合テスト
    - セッション開始から質問、回答、校正、音声再生までの完全なフロー
    - _Requirements: 全体的なワークフロー_

- [x] 17. 最終チェックポイント
  - すべてのテストが通ることを確認してください。質問があれば聞いてください。

## Notes

- `*`マークのタスクはオプションで、より早くMVPを完成させたい場合はスキップ可能です
- 各タスクは具体的な要件を参照しており、トレーサビリティを確保しています
- チェックポイントタスクで段階的な検証を行います
- プロパティテストは普遍的な正しさを検証し、ユニットテストは具体的な例とエッジケースを検証します
- fast-checkライブラリを使用し、各プロパティテストは最低100回の反復実行を行います
