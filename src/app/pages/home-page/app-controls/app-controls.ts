import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FileTransfer } from '@capacitor/file-transfer';
import { Directory, Filesystem } from '@capacitor/filesystem';

@Component({
  selector: 'app-controls',
  imports: [],
  templateUrl: './app-controls.html',
  styleUrl: './app-controls.scss'
})
export class AppControls {
  private router = inject(Router);

  addData() {
    this.router.navigate(['add-content']);
  }
  addFromClipboard() { }

  async downloadModel() {

    await Filesystem.mkdir({
      path: "models/sentence-transformers/all-MiniLM-L6-v2/",
      directory: Directory.Data,
      recursive: true,
    }).catch(() => { });

    const url = `https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/onnx/model_qint8_arm64.onnx`;

    const fileInfo = await Filesystem.getUri({
      directory: Directory.Data,
      path: 'models/sentence-transformers/all-MiniLM-L6-v2/model_qint8_arm64.onnx'
    });


    await FileTransfer.downloadFile({
      url,
      path: fileInfo.uri,
    });

    const url1 = `https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/`;

    const opt = [
      "config.json",
      "tokenizer_config.json",
      "tokenizer.json"
    ]

    opt.forEach(async (aOpt) => {
      const fileInfo = await Filesystem.getUri({
        directory: Directory.Data,
        path: `models/sentence-transformers/all-MiniLM-L6-v2/${aOpt}`
      });

      let test = url1 + aOpt;

      await FileTransfer.downloadFile({
        url: test,
        path: fileInfo.uri,
      });

    });


    FileTransfer.addListener('progress', (progress) => {
      console.log(`Downloaded ${progress.bytes} of ${progress.contentLength}`);
    });
  }
}
