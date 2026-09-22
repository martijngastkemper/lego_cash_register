import axios from 'axios';
import FormData from 'form-data';
import fs from 'node:fs';

interface BoundingBox {
  left: number;
  upper: number;
  right: number;
  lower: number;
  image_width: number;
  image_height: number;
  score: number;
}

interface ExternalSite {
  name: string;
  url: string;
}

interface CandidateColor {
  id: string;
  name: string;
  score: number;
}

interface CandidateItem {
  id: string;
  name: string;
  img_url: string;
  external_sites: ExternalSite[];
  category: string | null;
  type: 'part' | 'set' | 'fig' | 'sticker';
  score: number;
}

interface SearchResults {
  listing_id: string;
  bounding_box: BoundingBox;
  items: CandidateItem[];
  colors?: CandidateColor[];
}

export class BrickognizeClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'https://api.brickognize.com';
  }

  async predictPart(imagePath: string): Promise<SearchResults> {
    const form = new FormData();
    form.append('query_image', fs.createReadStream(imagePath));

    const response = await axios.post(
      `${this.baseUrl}/predict/parts/?predict_color=true`,
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
      }
    );

    return response.data as SearchResults;
  }
}
