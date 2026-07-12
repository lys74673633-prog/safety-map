const { sendJson, setCors } = require('./_http');

const FALLBACK = {
  서울역: {
    stationName: '서울역',
    lineName: '4호선',
    source: 'fallback',
    gates: [
      { exitNo: '1번 출구', elevator: true, escalator: true, wheelchairLift: false },
      { exitNo: '2번 출구', elevator: true, escalator: false, wheelchairLift: true },
    ],
    movement: [{ from: '1번 출구', to: '승강장', detail: '엘리베이터 이용', elevatorType: 'EV' }],
    facilities: [{ label: '장애인 화장실', location: '대합실' }],
  },
  강남역: {
    stationName: '강남역',
    lineName: '2호선',
    source: 'fallback',
    gates: [{ exitNo: '1번 출구', elevator: true, escalator: true, wheelchairLift: false }],
    movement: [],
    facilities: [{ label: '장애인 화장실', location: '대합실' }],
  },
};

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    return res.end();
  }

  const name = String(req.query.name || '').trim();
  const hit = FALLBACK[name];
  if (hit) return sendJson(res, 200, hit);
  return sendJson(res, 200, {
    stationName: name || '역',
    source: 'fallback',
    gates: [],
    movement: [],
    facilities: [],
    message: '상세 교통약자 정보는 샘플 데이터로 제공됩니다.',
  });
};
