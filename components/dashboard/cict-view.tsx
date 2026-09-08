'use client';
import { FilePlus2, CheckCheck, CircleX, ScanLine } from 'lucide-react';
import { Panel, Stat, Distribution } from './shared';
import { CaseTable } from './case-table';
import type { CaseRecord } from '@/lib/dashboard-data';
export function CictView({
  cases,
  retry,
}: {
  cases: CaseRecord[];
  retry: (id: string) => Promise<void>;
}) {
  return (
    <>
      <div className="stats-grid">
        <Stat
          label="今日新增 Case"
          value="386"
          foot="较昨日 +15.2% · 12 个构建批次"
          icon={<FilePlus2 size={17} />}
        />
        <Stat
          label="测试成功次数"
          value="365"
          foot="Case 通过率 94.6%"
          icon={<CheckCheck size={17} />}
        />
        <Stat
          label="测试失败次数"
          value="21"
          foot="CAN 12 · BFT 6 · IMMO 3"
          icon={<CircleX size={17} />}
        />
        <Stat
          label="成功解析次数"
          value="378"
          foot="解析失败 8 · 解析成功率 97.9%"
          icon={<ScanLine size={17} />}
        />
      </div>
      <div className="three-cols">
        <Panel title="测试类型分布" subtitle="今日 Case · 按主要测试类型">
          <Distribution
            items={[
              { name: 'BFT 基础功能', value: 182 },
              { name: 'CAN 通信测试', value: 136 },
              { name: 'IMMO 防盗认证', value: 68 },
            ]}
          />
        </Panel>
        <Panel title="测试用户分布" subtitle="今日 Case · 按提交人">
          <Distribution
            items={[
              { name: '陈思远', value: 142 },
              { name: '王子涵', value: 108 },
              { name: '李明', value: 86 },
              { name: '其他用户', value: 50 },
            ]}
          />
        </Panel>
        <Panel title="测试平台分布" subtitle="今日 Case · 按运行平台">
          <Distribution
            items={[
              { name: 'Linux · x86_64', value: 218 },
              { name: 'QNX · ARM64', value: 112 },
              { name: 'Windows · x64', value: 56 },
            ]}
          />
        </Panel>
      </div>
      <CaseTable cases={cases} retry={retry} />
    </>
  );
}
