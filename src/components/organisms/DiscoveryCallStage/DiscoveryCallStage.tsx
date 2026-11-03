'use client'

/**
 * DiscoveryCallStage — Organism
 * The call between the NDA and Value & Due Diligence. The Director adds the meeting notes,
 * transcripts and recordings in one uploader, then proceeds (or skips), which hands the case to
 * the sponsor. The call can also be held on the platform (PlatformCallRoom), where a listening
 * agent writes the summary. Everyone else waits and can read what was added.
 * Used in: PartnershipDetail
 */

import React, { useState } from 'react'
import { FileText, Film, Mic } from 'lucide-react'
import { FilePicker } from '@/components/molecules/FilePicker'
import { StageFooter } from '@/components/molecules/StageFooter'
import {
  CallFormatChoice,
  PlatformCallRoom,
  defaultCallAttendees,
  type CallFormat,
} from '@/components/organisms/PlatformCallRoom'
import type { CaseFile } from '@/types/partnership.types'
import type { DiscoveryCallStageProps } from './DiscoveryCallStage.types'

const contextKind = (name: string): 'notes' | 'transcripts' | 'recordings' => {
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase()
  if (['mp3', 'm4a', 'wav', 'mp4', 'mov'].includes(ext)) return 'recordings'
  if (ext === 'vtt') return 'transcripts'
  return 'notes'
}

const FileList: React.FC<{ label: string; files: CaseFile[]; icon: React.ReactNode }> = ({
  label,
  files,
  icon,
}) =>
  files.length === 0 ? null : (
    <ul
      aria-label={label}
      className="rounded-xl border border-[#e2e8f0] divide-y divide-[#f1f5f9] bg-white"
    >
      {files.map((f) => (
        <li key={f.name} className="flex items-center gap-3 px-4 py-3">
          {icon}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-[#0d212c] truncate">{f.name}</span>
            <span className="text-xs text-[#64748b]">
              {f.uploadedBy} · {f.uploadedOn}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )

export const DiscoveryCallStage: React.FC<DiscoveryCallStageProps> = ({
  request,
  role,
  onAction,
  onNext,
  className = '',
}) => {
  const isDirector = role === 'director'
  const proceeded = Boolean(request.discovery?.proceededOn)
  const discovery = { notes: [], transcripts: [], recordings: [], ...request.discovery }
  const hasFiles =
    discovery.notes.length + discovery.transcripts.length + discovery.recordings.length > 0
  const canAdd = isDirector && !proceeded
  const held = request.discovery?.platformCall
  const [format, setFormat] = useState<CallFormat>(held ? 'platform' : 'outside')
  const onPlatform = Boolean(held) || format === 'platform'

  const proceed = () => {
    onAction({ type: 'proceedToValue' })
    onNext()
  }

  return (
    <div className={`flex flex-col gap-4 w-full h-full min-h-0 ${className}`.trim()}>
      <div className="flex flex-col gap-1 shrink-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xl font-semibold text-[#0d212c]">Discovery Call</h2>
          {canAdd && !held && (
            <CallFormatChoice name="discovery-call-format" value={format} onChange={setFormat} />
          )}
        </div>
        <p className="text-sm text-[#64748b]">
          {canAdd && onPlatform
            ? 'Hold the discovery call here. The agent listens and adds a summary to the meeting notes, then you hand the case to the sponsor.'
            : canAdd
              ? 'Upload the meeting notes, transcript or recording from the call, or skip this and go on. The sponsor takes over from here.'
              : proceeded
                ? 'The Director has handed this case to the sponsor.'
                : 'Waiting for the Director to hold the discovery call and hand this case on.'}
        </p>
      </div>

      <div className="relative flex-1 min-h-0 overflow-y-auto flex flex-col gap-5 pr-1">
        {onPlatform && (
          <PlatformCallRoom
            callType="discovery"
            caseCode={request.requestCode}
            request={request}
            hostName="Zaid Al Ali"
            canHost={canAdd}
            defaultAttendees={defaultCallAttendees(request, 'Zaid Al Ali')}
            saved={held}
            onComplete={(attendees, questions) =>
              onAction({ type: 'platformCall', callType: 'discovery', attendees, questions })
            }
          />
        )}
        {canAdd && !onPlatform && (
          <FilePicker
            label="Upload meeting notes, transcript or recording"
            hint="Documents, audio or video"
            accept=".doc,.docx,.pdf,.txt,.vtt,.mp3,.m4a,.wav,.mp4,.mov"
            multiple
            onPick={(names) =>
              names.forEach((name) =>
                onAction({ type: 'discoveryFile', kind: contextKind(name), name })
              )
            }
          />
        )}
        <FileList
          label="Meeting notes"
          files={discovery.notes}
          icon={<FileText className="w-5 h-5 text-[#2563eb]" aria-hidden="true" />}
        />
        <FileList
          label="Transcripts"
          files={discovery.transcripts}
          icon={<Mic className="w-5 h-5 text-[#7c3aed]" aria-hidden="true" />}
        />
        <FileList
          label="Recordings"
          files={discovery.recordings}
          icon={<Film className="w-5 h-5 text-[#ea580c]" aria-hidden="true" />}
        />
        {!canAdd && !hasFiles && (
          <p className="text-sm text-[#94a3b8]">Nothing has been added from the call.</p>
        )}
      </div>

      <StageFooter compact>
        <span />
        {canAdd ? (
          <div className="flex items-center gap-3">
            {/* Once the call has been held here, there is nothing to skip */}
            {!held && (
              <button
                type="button"
                onClick={proceed}
                className="h-10 px-5 rounded-lg border border-[#cbd5e1] bg-white text-sm font-semibold text-[#0d212c] hover:bg-slate-50 cursor-pointer transition"
              >
                Skip
              </button>
            )}
            <button
              type="button"
              onClick={proceed}
              className="h-10 px-5 rounded-lg bg-[#00a8b0] hover:bg-[#009199] text-sm font-semibold text-white shadow-xs cursor-pointer transition"
            >
              Proceed
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={!proceeded}
            onClick={onNext}
            className="h-10 px-5 rounded-lg bg-[#00a8b0] hover:bg-[#009199] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-sm font-semibold text-white shadow-xs cursor-pointer transition"
          >
            Next
          </button>
        )}
      </StageFooter>
    </div>
  )
}
