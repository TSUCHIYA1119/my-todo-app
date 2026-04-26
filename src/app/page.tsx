"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { supabase } from "@/lib/supabase";
import type { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) setError(error.message);
      else setTasks((data ?? []) as Task[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    setAdding(true);
    setError(null);
    const { data, error } = await supabase
      .from("tasks")
      .insert({ title: value, completed: false })
      .select()
      .single();
    setAdding(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data) setTasks((prev) => [data as Task, ...prev]);
    setTitle("");
  }

  async function toggleTask(task: Task) {
    const next = !task.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: next } : t))
    );
    const { error } = await supabase
      .from("tasks")
      .update({ completed: next })
      .eq("id", task.id);
    if (error) {
      setError(error.message);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, completed: task.completed } : t
        )
      );
    }
  }

  async function deleteTask(task: Task) {
    const snapshot = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) {
      setError(error.message);
      setTasks(snapshot);
    }
  }

  const remaining = tasks.filter((t) => !t.completed).length;

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-12 sm:py-20">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">つちやのTODOリスト</h1>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "読み込み中…"
              : `${remaining} 件の未完了 / 全 ${tasks.length} 件`}
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>新しいタスク</CardTitle>
            <CardDescription>
              やるべきことを書き出して整理しましょう
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addTask} className="flex gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 牛乳を買う"
                disabled={adding}
              />
              <Button type="submit" disabled={adding || !title.trim()}>
                {adding ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Plus />
                )}
                追加
              </Button>
            </form>
            {error && (
              <p className="mt-3 text-sm text-destructive">{error}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>タスク一覧</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" />
                読み込み中…
              </div>
            ) : tasks.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                まだタスクがありません
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="group flex items-center gap-3 py-3"
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(task)}
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm transition-colors",
                        task.completed &&
                          "text-muted-foreground line-through"
                      )}
                    >
                      {task.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => deleteTask(task)}
                      aria-label="削除"
                      className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-destructive"
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
