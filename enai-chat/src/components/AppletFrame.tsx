import React, { useEffect, useRef, useState } from 'react';
import {
  Applet,
  AppletActionsEvent,
  AppletDataEvent,
  AppletResizeEvent,
  applets,
} from "@web-applets/sdk";

interface AppletFrameProps {
  src?: string;
  data?: object;
  onData?: (event: AppletDataEvent) => void;
  onLoad?: () => void;
}

export const AppletFrame: React.FC<AppletFrameProps> = ({ src, data, onData, onLoad }) => {
  const containerRef = useRef<HTMLIFrameElement>(null);
  const [applet, setApplet] = useState<Applet | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({ height: 350, width: '100%' });

  // Load applet when src changes
  useEffect(() => {
    if (!src || !containerRef.current) return;

    const loadApplet = async () => {
        try{
            // eslint-disable-next-line
            const newApplet = await applets.load(src, containerRef.current!);
            setApplet(newApplet);
            setLoaded(true);
            if (onLoad) onLoad();

          // When data received, call the onData callback
          newApplet.ondata = (dataEvent: AppletDataEvent) => {
            if (onData) onData(dataEvent);
          };

        }catch(error){
            console.error("Failed to load applet:", error);
        }
      
      

    //   // Resize
    //   newApplet.onresize = (resizeEvent: AppletResizeEvent) => {
    //     setDimensions(prev => ({ 
    //       ...prev, 
    //       height: resizeEvent.dimensions.height 
    //     }));
    //   };

    //   newApplet.onactions = (e: AppletActionsEvent) => {};


    };

    loadApplet();
  }, [src, onData, onLoad]);

  // Update applet data when data prop changes
  useEffect(() => {
    if (!applet || !loaded || data === undefined) return;
    applet.data = data;
  }, [applet, data, loaded]);

  return (
    <div 
      style={{ 
        display: 'flex',
        flexDirection: 'column',
        height: `${dimensions.height}px`,
      }}
    >
      <applet-frame 
        ref={containerRef}
        style={{
          border: 'none',
          height: '100%',
          width: '100%',
        }}
      />
    </div>
  );
};

export default AppletFrame;