'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
  cursorChar?: string;
  onComplete?: () => void;
  className?: string;
  preserveWhitespace?: boolean;
}

export function Typewriter({
  text,
  speed = 50,
  delay = 0,
  cursor = true,
  cursorChar = '|',
  onComplete,
  className,
  preserveWhitespace = true,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const cursorIntervalRef = useRef<NodeJS.Timeout>();

  // 重置状态当文本改变时
  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
    setIsComplete(false);
    setShowCursor(true);
  }, [text]);

  // 打字机效果
  useEffect(() => {
    if (currentIndex < text.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, currentIndex === 0 ? delay : speed);
    } else if (currentIndex === text.length && !isComplete) {
      setIsComplete(true);
      onComplete?.();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, text, speed, delay, isComplete, onComplete]);

  // 光标闪烁效果
  useEffect(() => {
    if (cursor) {
      cursorIntervalRef.current = setInterval(() => {
        setShowCursor(prev => !prev);
      }, 500);
    }

    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, [cursor]);

  const displayContent = preserveWhitespace 
    ? displayText.split('\n').map((line, index, array) => (
        <React.Fragment key={index}>
          {line}
          {index < array.length - 1 && <br />}
        </React.Fragment>
      ))
    : displayText;

  return (
    <span className={cn('inline-block', className)}>
      {displayContent}
      {cursor && showCursor && (
        <span className="animate-pulse text-primary">{cursorChar}</span>
      )}
    </span>
  );
}

export interface StreamingContentProps {
  content: string;
  isStreaming: boolean;
  typewriterSpeed?: number;
  className?: string;
  onTypewriterComplete?: () => void;
}

export function StreamingContent({
  content,
  isStreaming,
  typewriterSpeed = 30,
  className,
  onTypewriterComplete,
}: StreamingContentProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const contentRef = useRef(content);
  const lastProcessedLength = useRef(0);

  // 当内容更新时，处理新增的内容
  useEffect(() => {
    if (content.length > lastProcessedLength.current) {
      const newContent = content.slice(lastProcessedLength.current);
      setDisplayedContent(prev => prev + newContent);
      lastProcessedLength.current = content.length;
    }
    contentRef.current = content;
  }, [content]);

  // 当流式传输结束时，确保所有内容都显示
  useEffect(() => {
    if (!isStreaming && content !== displayedContent) {
      setDisplayedContent(content);
      lastProcessedLength.current = content.length;
    }
  }, [isStreaming, content, displayedContent]);

  // 重置状态
  useEffect(() => {
    if (content === '') {
      setDisplayedContent('');
      lastProcessedLength.current = 0;
      setIsTyping(false);
    }
  }, [content]);

  const formattedContent = displayedContent.split('\n').map((line, index, array) => (
    <React.Fragment key={index}>
      {line}
      {index < array.length - 1 && <br />}
    </React.Fragment>
  ));

  return (
    <div className={cn('whitespace-pre-wrap', className)}>
      {formattedContent}
      {isStreaming && (
        <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1" />
      )}
    </div>
  );
}