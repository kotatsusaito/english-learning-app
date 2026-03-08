# Design Document: English Learning App

## Overview

本システムは、AIとの対話型学習を通じて英語能力を向上させるWebアプリケーションです。ユーザーはAIから英語で質問を受け、英語で回答し、即座にフィードバックと音声による発音例を得ることができます。

### 主要な設計決定

1. **AIプロバイダー**: OpenAI GPT-4またはAnthropic Claudeを使用し、自然な質問生成と高精度な文法校正を実現
2. **音声合成**: Web Speech API（ブラウザネイティブ）またはOpenAI TTS APIを使用
3. **アーキテクチャ**: フロントエンドとバックエンドを分離したクライアント・サーバーモデル
4. **状態管理**: セッション状態をメモリ内で管理し、必要に応じて永続化

## Architecture

### システム構成

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (UI)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Question     │  │ Response     │  │ Audio        │  │
│  │ Display      │  │ Input        │  │ Player       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend (API Server)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Session      │  │ AI Service   │  │ Speech       │  │
│  │ Manager      │  │ Adapter      │  │ Service      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            │ API Calls
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   External Services                      │
│  ┌──────────────┐                    ┌──────────────┐  │
│  │ OpenAI/      │                    │ TTS API      │  │
│  │ Claude API   │                    │ (Optional)   │  │
│  └──────────────┘                    └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### レイヤー分離

- **プレゼンテーション層**: ユーザーインターフェース、入力検証、表示ロジック
- **アプリケーション層**: ビジネスロジック、セッション管理、ワークフロー制御
- **統合層**: 外部AIサービスとの通信、音声合成サービスとの連携

## Components and Interfaces

### 1. Frontend Components

#### QuestionDisplay
質問を表示するコンポーネント

```typescript
interface QuestionDisplay {
  // 質問テキストを表示
  displayQuestion(question: string): void
  
  // ローディング状態を表示
  showLoading(): void
  
  // エラーメッセージを表示
  showError(message: string): void
}
```

#### ResponseInput
ユーザーの回答入力を管理

```typescript
interface ResponseInput {
  // 入力フィールドを有効化
  enable(): void
  
  // 入力フィールドを無効化
  disable(): void
  
  // 入力値を取得
  getValue(): string
  
  // 入力値をクリア
  clear(): void
  
  // 送信イベントハンドラを登録
  onSubmit(handler: (text: string) => void): void
}
```

#### CorrectionDisplay
元の回答と校正結果を表示

```typescript
interface CorrectionDisplay {
  // 元の回答と校正結果を表示
  displayCorrection(original: string, corrected: string, explanation: string): void
  
  // 校正なし（正しい回答）を表示
  displayCorrect(response: string): void
  
  // 表示をクリア
  clear(): void
}
```

#### AudioPlayer
音声再生を管理

```typescript
interface AudioPlayer {
  // 音声を読み込み
  loadAudio(audioUrl: string): Promise<void>
  
  // 音声を再生
  play(): Promise<void>
  
  // 音声を停止
  stop(): void
  
  // 再生状態を取得
  isPlaying(): boolean
}
```

### 2. Backend Components

#### SessionManager
学習セッションのライフサイクルを管理

```typescript
interface SessionManager {
  // 新しいセッションを作成
  createSession(): Session
  
  // セッションを取得
  getSession(sessionId: string): Session | null
  
  // セッションを終了
  endSession(sessionId: string): void
  
  // セッションに質問を追加
  addQuestion(sessionId: string, question: string): void
  
  // セッションに回答を追加
  addResponse(sessionId: string, response: UserResponse): void
}

interface Session {
  id: string
  startTime: Date
  conversationHistory: ConversationTurn[]
  isActive: boolean
}

interface ConversationTurn {
  question: string
  userResponse: string
  correction: Correction | null
  timestamp: Date
}
```

#### AIServiceAdapter
AI APIとの通信を抽象化

```typescript
interface AIServiceAdapter {
  // 質問を生成
  generateQuestion(context: ConversationContext): Promise<string>
  
  // 回答を分析し校正を生成
  analyzeAndCorrect(response: string, question: string): Promise<CorrectionResult>
}

interface ConversationContext {
  previousTurns: ConversationTurn[]
  sessionId: string
}

interface CorrectionResult {
  hasErrors: boolean
  correctedText: string
  explanation: string
  suggestions: string[]
}
```

#### SpeechService
テキストを音声に変換

```typescript
interface SpeechService {
  // テキストを音声に変換
  synthesize(text: string, options: SpeechOptions): Promise<AudioData>
  
  // 音声合成が利用可能かチェック
  isAvailable(): boolean
}

interface SpeechOptions {
  language: string  // 'en-US', 'en-GB' など
  voice?: string
  speed?: number
}

interface AudioData {
  url: string
  format: string
  duration: number
}
```

### 3. API Endpoints

```
POST   /api/sessions              # 新しいセッションを開始
GET    /api/sessions/:id          # セッション情報を取得
DELETE /api/sessions/:id          # セッションを終了

POST   /api/sessions/:id/question # 新しい質問を生成
POST   /api/sessions/:id/response # ユーザーの回答を送信し校正を取得

POST   /api/speech/synthesize     # テキストを音声に変換
```

## Data Models

### Session
```typescript
type Session = {
  id: string
  startTime: Date
  conversationHistory: ConversationTurn[]
  isActive: boolean
}
```

### ConversationTurn
```typescript
type ConversationTurn = {
  question: string
  userResponse: string
  correction: Correction | null
  timestamp: Date
}
```

### Correction
```typescript
type Correction = {
  hasErrors: boolean
  originalText: string
  correctedText: string
  explanation: string
  suggestions: string[]
}
```

### UserResponse
```typescript
type UserResponse = {
  text: string
  submittedAt: Date
}
```

### AudioData
```typescript
type AudioData = {
  url: string
  format: string  // 'mp3', 'wav', 'ogg'
  duration: number  // seconds
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Question Generation Consistency
*For any* learning session state (new session or after user response), the AI_Engine should successfully generate a valid English question.
**Validates: Requirements 1.1, 1.2**

### Property 2: Question Type Diversity
*For any* sequence of N questions (where N ≥ 5), the generated questions should include at least 2 different question types (e.g., open-ended, yes/no, opinion-based).
**Validates: Requirements 1.4**

### Property 3: Input Display Synchronization
*For any* text input by the user, the displayed text should match the input text character-by-character in real-time.
**Validates: Requirements 2.2**

### Property 4: Response Persistence Round-Trip
*For any* user response text, submitting the response and then retrieving it should return the exact same text without modification.
**Validates: Requirements 2.3, 3.2**

### Property 5: Original Response Visibility
*For any* submitted user response, the system should display the original text even when corrections are shown.
**Validates: Requirements 3.1, 3.3**

### Property 6: Grammar Analysis Execution
*For any* submitted response text, the AI_Engine should perform grammatical analysis and return a result (either corrections or confirmation of correctness).
**Validates: Requirements 4.1**

### Property 7: Correction Generation for Errors
*For any* response text containing grammatical errors, the AI_Engine should generate a Correction object with corrected text.
**Validates: Requirements 4.2**

### Property 8: Dual Display of Original and Corrected
*For any* correction result, the display should contain both the original user response and the corrected text.
**Validates: Requirements 4.4**

### Property 9: Speech Synthesis for Corrections
*For any* corrected text, the Speech_Synthesizer should generate audio data that can be played.
**Validates: Requirements 5.1**

### Property 10: Audio Replay Capability
*For any* generated audio, the system should allow the play function to be called multiple times successfully.
**Validates: Requirements 5.4**

### Property 11: Conversation Context Preservation
*For any* active session, adding a new conversation turn should preserve all previous turns in the conversation history.
**Validates: Requirements 6.2**

### Property 12: Session Creation Availability
*For any* point in time, the system should be able to create a new session successfully.
**Validates: Requirements 6.4**

### Property 13: Error Logging Completeness
*For any* error that occurs in the system, an error log entry should be created with relevant details.
**Validates: Requirements 7.4**

### Property 14: Data Preservation During Recoverable Errors
*For any* user input data and any recoverable error scenario, the user input data should remain accessible after the error is handled.
**Validates: Requirements 7.5**

## Error Handling

### Error Categories

1. **AI Service Errors**
   - API rate limits exceeded
   - Network timeouts
   - Invalid API responses
   - Service unavailability

2. **Speech Synthesis Errors**
   - Browser API not supported
   - TTS service unavailable
   - Audio format not supported

3. **Session Errors**
   - Invalid session ID
   - Session expired
   - Concurrent modification conflicts

4. **Input Validation Errors**
   - Empty responses
   - Excessively long inputs
   - Invalid characters

### Error Handling Strategies

#### Graceful Degradation
音声合成が失敗した場合でも、テキストベースの校正機能は継続して動作します。

```typescript
async function handleCorrection(response: string): Promise<void> {
  try {
    const correction = await aiService.analyzeAndCorrect(response)
    displayCorrection(correction)
    
    try {
      const audio = await speechService.synthesize(correction.correctedText)
      audioPlayer.loadAudio(audio.url)
    } catch (speechError) {
      // 音声合成失敗時もテキスト表示は継続
      logError('Speech synthesis failed', speechError)
      showNotification('Audio unavailable, but text correction is displayed')
    }
  } catch (aiError) {
    logError('AI correction failed', aiError)
    showError('Unable to analyze response. Please try again.')
  }
}
```

#### Retry Logic
一時的なネットワークエラーに対しては自動リトライを実装します。

```typescript
async function generateQuestionWithRetry(
  context: ConversationContext,
  maxRetries: number = 3
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await aiService.generateQuestion(context)
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error('Failed to generate question after multiple attempts')
      }
      await delay(1000 * attempt) // Exponential backoff
    }
  }
}
```

#### User Feedback
すべてのエラーに対して、ユーザーに明確なフィードバックを提供します。

```typescript
interface ErrorMessage {
  title: string
  message: string
  actionable: boolean
  retryable: boolean
}

function getErrorMessage(error: Error): ErrorMessage {
  if (error instanceof NetworkError) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the service. Please check your internet connection.',
      actionable: true,
      retryable: true
    }
  }
  // ... other error types
}
```

## Testing Strategy

### Dual Testing Approach

本システムでは、ユニットテストとプロパティベーステストの両方を使用して包括的なテストカバレッジを実現します。

#### Unit Tests
ユニットテストは以下に焦点を当てます:
- 特定の例とエッジケース（空の入力、非常に長い入力など）
- コンポーネント間の統合ポイント
- エラー条件と境界値

例:
- 空の回答を送信した場合の動作
- セッション開始時の初期状態
- 音声合成失敗時のフォールバック動作

#### Property-Based Tests
プロパティベーステストは以下に焦点を当てます:
- すべての入力に対して成立すべき普遍的な特性
- ランダム化による包括的な入力カバレッジ
- 設計書で定義された各Correctness Property

各プロパティテストは:
- 最低100回の反復実行を行う
- 設計書のプロパティ番号を参照するタグを含む
- タグ形式: `Feature: english-learning-app, Property N: [property text]`

### Property-Based Testing Library

実装言語に応じて以下のライブラリを使用します:
- **TypeScript/JavaScript**: fast-check
- **Python**: Hypothesis
- **Java**: jqwik
- **Rust**: proptest

### Test Coverage Requirements

1. すべてのCorrectness Propertiesに対応するプロパティテストを実装
2. 各APIエンドポイントに対する統合テスト
3. エラーハンドリングパスのユニットテスト
4. UIコンポーネントの動作テスト

### Example Property Test Structure

```typescript
import fc from 'fast-check'

// Feature: english-learning-app, Property 4: Response Persistence Round-Trip
describe('Response Persistence', () => {
  it('should preserve exact user response text through submit and retrieve', () => {
    fc.assert(
      fc.property(fc.string(), async (userInput) => {
        const session = await createSession()
        await submitResponse(session.id, userInput)
        const retrieved = await getLastResponse(session.id)
        expect(retrieved.text).toBe(userInput)
      }),
      { numRuns: 100 }
    )
  })
})
```

## Implementation Notes

### AI Prompt Engineering

質問生成と文法校正の品質は、AIへのプロンプト設計に大きく依存します。

#### Question Generation Prompt Template
```
You are an English conversation teacher. Generate a natural, engaging question in English 
for a language learner to practice responding.

Context: {previous conversation turns}

Requirements:
- Ask only ONE question
- Use clear, grammatically correct English
- Vary question types (open-ended, opinion, experience-based)
- Keep questions appropriate for intermediate learners
- Make questions engaging and relevant to everyday life

Question:
```

#### Grammar Correction Prompt Template
```
You are an English grammar expert. Analyze the following response and provide corrections.

Question: {original question}
User Response: {user response}

Tasks:
1. Identify grammatical errors
2. Provide corrected version
3. Explain the corrections briefly
4. Suggest better expressions if applicable

Format your response as JSON:
{
  "hasErrors": boolean,
  "correctedText": string,
  "explanation": string,
  "suggestions": string[]
}
```

### Performance Considerations

1. **AI API Latency**: 質問生成と校正には1-3秒かかる可能性があるため、ローディング状態を明確に表示
2. **Audio Caching**: 同じテキストの音声は再利用可能な場合はキャッシュ
3. **Session Storage**: メモリ内セッションは定期的にクリーンアップ（例: 24時間後）

### Security Considerations

1. **API Key Protection**: AI APIキーはバックエンドでのみ使用し、フロントエンドに露出しない
2. **Rate Limiting**: ユーザーごとのAPI呼び出し回数を制限
3. **Input Sanitization**: ユーザー入力をログに記録する前にサニタイズ
4. **Session Security**: セッションIDは推測困難なランダム値を使用
