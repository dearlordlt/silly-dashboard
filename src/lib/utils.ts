import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number | null | undefined, decimals = 1): string {
	if (bytes == null || !isFinite(bytes)) return '—';
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
	const i = Math.min(Math.floor(Math.log(Math.abs(bytes)) / Math.log(k)), sizes.length - 1);
	return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
}

export function formatRate(bytesPerSec: number | null | undefined): string {
	if (bytesPerSec == null) return '—';
	return `${formatBytes(bytesPerSec, 1)}/s`;
}

export function formatPercent(n: number | null | undefined, decimals = 0): string {
	if (n == null || !isFinite(n)) return '—';
	return `${n.toFixed(decimals)}%`;
}

export function formatUptime(seconds: number | null | undefined): string {
	if (seconds == null || !isFinite(seconds) || seconds < 0) return '—';
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	if (days > 0) return `${days}d ${hours}h`;
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}

/** Pick a tailwind text color class based on a 0-100 utilization */
export function utilColor(percent: number | null | undefined): string {
	if (percent == null) return 'text-neutral-500';
	if (percent < 60) return 'text-emerald-400';
	if (percent < 85) return 'text-yellow-400';
	return 'text-red-400';
}

/** Pick a tailwind bg color class for a bar fill */
export function utilBgColor(percent: number | null | undefined): string {
	if (percent == null) return 'bg-neutral-700';
	if (percent < 60) return 'bg-emerald-500';
	if (percent < 85) return 'bg-yellow-500';
	return 'bg-red-500';
}
