import { useEffect,type CSSProperties } from "react";

interface FC2CounterProps {
  style?: CSSProperties;
}

function FC2Counter({ style }: FC2CounterProps) {
    useEffect(() => {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = '//counter1.fc2.com/counter.php?id=14567688&main=1';
        script.async = true;
        //document.body.appendChild(script);不具合があるのでいらない

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);
    
return (
    <div style={{...style, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", fontSize: "0.9rem"}}>
        あなたは
        <img
            src="//counter1.fc2.com/counter_img.php?id=14567688&main=1"
            alt="FC2 Counter"
            style={{ display: "inline-block", margin: "0" }}
            onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.insertAdjacentHTML('afterend', '<span style="color: #ffeb3b; font-weight: bold;">Tru</span>');
            }}
            />
        thの来訪者です
    </div>
);
}

export default FC2Counter;