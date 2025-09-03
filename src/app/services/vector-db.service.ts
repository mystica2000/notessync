import { inject, Injectable } from '@angular/core';
import { EmbeddingService } from './embedding.service';

@Injectable({
  providedIn: 'root'
})
export class VectorDbService {
  private documents = [
    "dogs are loyal and friendly",
    "cats like to nap in sunny spots",
    "parrots can mimic human speech",
    "goldfish have a memory longer than 3 seconds",
    "rabbits love to chew on cardboard",
    // food
    "pizza is best when it's fresh and hot",
    "avocado toast is a trendy breakfast choice",
    "spicy ramen warms you up on cold days",
    "homemade cookies smell amazing while baking",
    "dark chocolate has a rich, bitter taste",
  ]

  private embeddingService = inject(EmbeddingService);

  async initializeModel() {
    await this.embeddingService.loadModel();
  }

  searchForQuery(query: string) {
    console.log("SO THE QUERY IS ", query);
  }
}
