# 构建阶段：按 lockfile 复现依赖，类型检查不过就直接中断构建，产物落在 dist/
FROM node:20-alpine AS build
WORKDIR /srv/web
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段：用 vite preview 托管静态产物并按仓库配置（.env.production）代理 /api。
# preview 需要 vite 与插件，故连同 lockfile 依赖与源码配置一起拷贝；实际只服务 dist。
FROM node:20-alpine AS runtime
WORKDIR /srv/web
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force
COPY . .
COPY --from=build /srv/web/dist ./dist
EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--mode", "production"]
