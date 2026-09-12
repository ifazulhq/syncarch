import React from 'react';
import { Navigation } from 'lucide-react';

export default function CursorOverlay({ users, myUser }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {users
        .filter((user) => user.id !== myUser?.id && user.cursor)
        .map((user) => {
          const { x, y } = user.cursor;
          return (
            <div
              key={user.id}
              style={{
                transform: `translate3d(${x}px, ${y}px, 0)`,
                transition: 'transform 0.08s linear'
              }}
              className="absolute left-0 top-0 flex flex-col items-start"
            >
              {/* Custom Colored Mouse Pointer Icon */}
              <Navigation
                className="w-5 h-5 -rotate-45 drop-shadow-md"
                style={{ color: user.color, fill: user.color }}
              />

              {/* Name Tag Badge */}
              <div
                className="ml-4 -mt-2 px-2 py-0.5 rounded-full text-[11px] font-medium text-slate-900 font-mono shadow-lg flex items-center space-x-1 whitespace-nowrap"
                style={{ backgroundColor: user.color }}
              >
                <span>{user.name}</span>
              </div>
            </div>
          );
        })}
    </div>
  );
}
