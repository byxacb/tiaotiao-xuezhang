export type Reading = {
  id: string;
  title: string;
  source: string;
  ageHint: string;
  paragraphs: string[];
};

export const readings: Reading[] = [
  {
    id: "stars-village",
    title: "院子里的星星",
    source: "自建短文",
    ageHint: "适合 6-10 岁",
    paragraphs: [
      "晚饭后，阿禾和奶奶坐在院子里。天慢慢黑了，第一颗星星像一粒小小的米，挂在屋檐上方。",
      "阿禾问：星星为什么不会掉下来？奶奶说：我也想知道，我们一起问问跳跳学长吧。",
      "跳跳学长说：星星离我们非常非常远，看起来小，其实有些比太阳还大。它不会掉下来，是因为它在自己的路上运动。"
    ]
  },
  {
    id: "river-stone",
    title: "河边的圆石头",
    source: "自建短文",
    ageHint: "适合 7-12 岁",
    paragraphs: [
      "小满在河边捡到一块圆圆的石头。它摸起来很滑，像被谁认真打磨过。",
      "爸爸说：也许不是人磨的，是河水磨的。水每天推着石头滚一点，很多年以后，尖角就变圆了。",
      "小满把石头放回河边，心里想：原来慢慢来，也能改变很多东西。"
    ]
  },
  {
    id: "little-seed",
    title: "一粒种子的旅行",
    source: "自建短文",
    ageHint: "适合 6-12 岁",
    paragraphs: [
      "风吹过田埂，一粒小种子离开妈妈，落在一块湿湿的泥土里。",
      "它先长出细细的根，像小手一样抓住泥土。再长出嫩绿的芽，慢慢向太阳伸腰。",
      "孩子问：它怎么知道往上长？跳跳学长说：植物会感受光和水，它们也在用自己的方式学习。"
    ]
  }
];
