# 依赖、类型检查、构建都走 package.json 里固化的脚本；
# 依赖版本由 package-lock.json 锁定，换机器 npm ci 装出一致结果。
# 仅 host=0.0.0.0 是容器网络的放行要求，不覆盖端口与代理取数口径
# （端口、代理目标仍以 vite.config.ts 与 .env.* 为准）。
FROM node:20-alpine
WORKDIR /srv/web
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
