import { useEffect, type ReactNode } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { LeftPanel } from '@/components/layout/LeftPanel';
import { CenterPanel } from '@/components/layout/CenterPanel';
import { RightPanel } from '@/components/layout/RightPanel';
import { BottomBar } from '@/components/layout/BottomBar';
import { useLeftIconOnly, useRightDrawer } from '@/hooks/useBreakpoint';
import { useLayoutStore } from '@/stores/layout';

interface MainLayoutProps {
  leftContent?: ReactNode;
  children?: ReactNode;
}

export function MainLayout({ leftContent, children }: MainLayoutProps) {
  const iconOnly = useLeftIconOnly();
  const drawer = useRightDrawer();

  useEffect(() => {
    if (iconOnly) {
      useLayoutStore.setState({ leftPanelCollapsed: true });
    }
  }, [iconOnly]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar />

      <div className="flex min-h-0 flex-1">
        <LeftPanel iconOnly={iconOnly}>{leftContent}</LeftPanel>

        <div className="flex min-h-0 flex-1 flex-col">
          <CenterPanel>{children}</CenterPanel>
          {drawer && <RightPanel drawer />}
        </div>

        {!drawer && <RightPanel />}
      </div>

      <BottomBar />
    </div>
  );
}
