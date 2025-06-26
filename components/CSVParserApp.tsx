"use client";

import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { startOfWeek, format, addWeeks } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';

export default function CSVParserApp() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<any[]>([]);
  const [sorting, setSorting] = useState([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setCsvFile(e.target.files[0]);
    }
  };

  const parseCSV = () => {
    if (!csvFile) return;

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cleaned = results.data.map((row: any) => {
          const rawAmount = row.amount || row.Amount || row[" Amount"] || row["amount"] || '0';
          const normalizedAmount = typeof rawAmount === 'string' ? parseFloat(rawAmount.replace(/[$,\s]/g, '')) : 0;

          return {
            date: row.date || row.Date || '',
            description: row.description || row.Description || '',
            amount: normalizedAmount,
            type: normalizedAmount >= 0 ? 'inflow' : 'outflow'
          };
        });

        setParsedData(cleaned);
        summarizeByWeek(cleaned);
      },
    });
  };

  const summarizeByWeek = (transactions: any[]) => {
    const summaryMap: Record<string, { inflow: number; outflow: number }> = {};
    const today = new Date();
    const start = startOfWeek(today);

    for (let i = 0; i < 13; i++) {
      const weekStart = format(addWeeks(start, i), 'yyyy-MM-dd');
      summaryMap[weekStart] = { inflow: 0, outflow: 0 };
    }

    transactions.forEach((txn) => {
      if (!txn.date) return;
      const weekStart = format(startOfWeek(new Date(txn.date)), 'yyyy-MM-dd');
      if (!summaryMap[weekStart]) {
        summaryMap[weekStart] = { inflow: 0, outflow: 0 };
      }
      if (txn.amount >= 0) {
        summaryMap[weekStart].inflow += txn.amount;
      } else {
        summaryMap[weekStart].outflow += txn.amount;
      }
    });

    const summarized = Object.entries(summaryMap).map(([weekStart, totals], index) => ({
      weekStart,
      inflow: totals.inflow,
      outflow: totals.outflow,
      net: totals.inflow + totals.outflow,
      weekNumber: index + 1,
    })).sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime());

    setWeeklySummary(summarized);
  };

  const columns = useMemo(
    () => [
      { accessorKey: 'date', header: 'Date' },
      { accessorKey: 'description', header: 'Description' },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: (info: any) => `$${info.getValue().toFixed(2)}`,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: (info: any) => info.getValue().toUpperCase(),
      },
    ],
    []
  );

  const table = useReactTable({
    data: parsedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-xl font-semibold">Bank CSV Parser</h2>
          <input type="file" accept=".csv" onChange={handleFileChange} />
          <Button onClick={parseCSV} disabled={!csvFile}>
            Parse CSV
          </Button>
        </CardContent>
      </Card>

      {parsedData.length > 0 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Parsed Transactions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border border-gray-200">
                <thead className="bg-gray-100">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-2 border cursor-pointer"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-t">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-2 border">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {weeklySummary.length > 0 && (
        <>
          <Card>
            <CardContent>
              <h3 className="text-lg font-medium mb-4">13-Week Cash Flow Forecast</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 border">Week #</th>
                      <th className="px-4 py-2 border">Week Start</th>
                      <th className="px-4 py-2 border">Inflow</th>
                      <th className="px-4 py-2 border">Outflow</th>
                      <th className="px-4 py-2 border">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklySummary.map((week, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-2 border">{week.weekNumber}</td>
                        <td className="px-4 py-2 border">{week.weekStart}</td>
                        <td className="px-4 py-2 border">${week.inflow.toFixed(2)}</td>
                        <td className="px-4 py-2 border text-red-600">${week.outflow.toFixed(2)}</td>
                        <td className="px-4 py-2 border font-semibold">${week.net.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="text-lg font-medium mb-4">Cash Flow Chart</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklySummary} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="weekStart" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="inflow" stroke="#22c55e" name="Inflow" />
                    <Line type="monotone" dataKey="outflow" stroke="#ef4444" name="Outflow" />
                    <Line type="monotone" dataKey="net" stroke="#3b82f6" name="Net" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
