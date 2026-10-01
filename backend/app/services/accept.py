"""验收确认业务规则：状态流转、字段校验与筛选口径都收在这里。"""
from __future__ import annotations

from datetime import date
from typing import Any

from app.store import store

MODULE = "accept"
REQUIRED_FIELDS = ["验收单号", "关联任务", "验收项目", "验收标准"]
STATUS_ORDER = ["待验收", "验收中", "已通过", "需返工"]
ACTION_RULES = {"开始验收": "验收中", "确认通过": "已通过", "下发返工": "需返工"}
NEGATIVE_ACTIONS = ["下发返工"]
# 列表筛选、汇总卡片、状态流转都认这一列，避免英文 status 与中文列各算各的。
STATUS_FIELD = "验收状态"


class AcceptService:
    def _filtered_rows(self, *, keyword: str | None = None, status: str | None = None) -> list[dict[str, Any]]:
        rows = store.rows(MODULE)
        if keyword:
            rows = [row for row in rows if keyword in str(row.get("验收单号", ""))]
        if status:
            rows = [row for row in rows if str(row.get(STATUS_FIELD, "")) == status]
        return rows

    def list_entries(
        self,
        *,
        keyword: str | None = None,
        status: str | None = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[dict[str, Any]], int]:
        rows = self._filtered_rows(keyword=keyword, status=status)
        total = len(rows)
        start = max(page - 1, 0) * size
        return rows[start:start + size], total

    def stats(self, *, keyword: str | None = None, status: str | None = None) -> list[dict[str, Any]]:
        """汇总卡片直接基于当前筛选口径计算，首张卡片就是列表 total。"""
        rows = self._filtered_rows(keyword=keyword, status=status)
        today = date.today()
        month_prefix = f"{today.year:04d}-{today.month:02d}"
        passed_this_month = sum(
            1
            for row in rows
            if str(row.get(STATUS_FIELD, "")) == "已通过" and str(row.get("验收日期", "")).startswith(month_prefix)
        )
        return [
            {"label": "验收单总数", "value": len(rows)},
            {"label": "待验收单据", "value": sum(1 for row in rows if str(row.get(STATUS_FIELD, "")) == "待验收")},
            {"label": "本月通过数", "value": passed_this_month},
            {"label": "需返工项数", "value": sum(1 for row in rows if str(row.get(STATUS_FIELD, "")) == "需返工")},
        ]

    def get_entry(self, entry_id: int) -> dict[str, Any] | None:
        return store.find(MODULE, entry_id)

    def create_entry(self, values: dict[str, Any]) -> tuple[dict[str, Any] | None, list[str]]:
        missing = [field for field in REQUIRED_FIELDS if not str(values.get(field) or "").strip()]
        if missing:
            return None, missing
        rows = store.rows(MODULE)
        entry = {"id": max((int(row.get("id", 0)) for row in rows), default=0) + 1}
        entry.update({field: values.get(field) for field in REQUIRED_FIELDS})
        entry[STATUS_FIELD] = STATUS_ORDER[0]
        entry["status"] = STATUS_ORDER[0]
        entry["pending"] = True
        entry["abnormal"] = False
        rows.append(entry)
        return entry, []

    def run_action(self, entry_id: int, action: str) -> tuple[dict[str, Any] | None, str]:
        entry = store.find(MODULE, entry_id)
        if entry is None:
            return None, f"验收单 {entry_id} 不存在或已归档"
        if action not in ACTION_RULES:
            return None, f"动作「{action}」不属于验收确认可执行范围"
        target = ACTION_RULES[action]
        if target not in STATUS_ORDER:
            return None, f"目标状态「{target}」不在允许的状态序列里"
        entry[STATUS_FIELD] = target
        entry["status"] = target
        entry["pending"] = target != STATUS_ORDER[-1]
        entry["abnormal"] = action in NEGATIVE_ACTIONS
        if target == "已通过":
            entry["验收日期"] = date.today().isoformat()
        return entry, f"验收单已{action}"
