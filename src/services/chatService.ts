import { generateCompletionStream } from './ollama';
import { AppConfig } from '../types';

export class ChatService {
  constructor(private appConfig: AppConfig) {}

  async processMessage(
    input: string,
    onMessage: (response: string) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
      await generateCompletionStream(
        {
          model: this.appConfig.model,
          prompt: input,
          system: this.appConfig.useSystemPrompt ? this.appConfig.systemPrompt : undefined,
          options: {
            temperature: this.appConfig.defaultTemperature,
            num_predict: this.appConfig.maxTokens,
          },
        },
        (response) => {
          onMessage(response.response);
        },
        onError,
        onComplete
      );
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}