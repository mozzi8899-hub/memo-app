console.log("서버 시작됨");
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI;

app.use(cors({ origin: true }));
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.use(express.json());

if (!mongoUri) {
  console.error('MONGODB_URI 환경변수가 필요합니다.');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => console.log('DB 연결 성공'))
  .catch(err => console.error('DB 연결 실패', err));

const Memo = mongoose.model('Memo', {
  content: String,
  createdAt: { type: Date, default: Date.now }
});

app.post('/save', async (req, res) => {
  try {
    const content = (req.body.content || '').trim();
    if (!content) {
      return res.status(400).json({ message: '메모 내용이 비어 있습니다.' });
    }

    const memo = new Memo({ content });
    await memo.save();
    res.status(201).json(memo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '저장 실패' });
  }
});

app.get('/load', async (req, res) => {
  try {
    const memos = await Memo.find().sort({ createdAt: -1 });
    res.json(memos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '불러오기 실패' });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'text.html'));
});

app.delete('/delete/:id', async (req, res) => {
  try {
    const deleted = await Memo.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: '메모를 찾을 수 없습니다.' });
    }
    res.json({ message: '삭제 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '삭제 실패' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`서버 실행됨: ${port}`);
});