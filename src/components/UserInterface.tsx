import * as React from 'react'
import styled from 'styled-components'
import { MutableRefObject, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { ProjectStoreContext } from '../App'
import { mapLinear, randInt } from 'three/src/math/MathUtils'
import { observer } from "mobx-react-lite"
import { Dropdown } from './components/dropdown'
import { ProjectStore } from '../store/project_store'

const InterfaceWrapper = styled.div`
  display: grid;
  grid-template-rows: 1fr auto;
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
`


const Dashboard = styled.div`
  justify-self: end;
  pointer-events: visible;
  min-width: 5%;
  max-width: 30%;
  display: flex;
  border-left: #e9e9e9 1px solid;
  color: black;
  flex-direction: row;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: -8px 2px 22px -7px rgb(0 0 0 / 25%);
  border-radius: 10px 0 0 10px;
`

const DashboardContent = styled.div`
  flex: 1;
  display: flex;
  flex-wrap: nowrap;
  align-items: start;
  flex-direction: column;
  gap: 20px;
  
  justify-self: end;
  padding: 20px;
`

const ToggleButton = styled.div`
  pointer-events: auto;
  z-index: 99;
  
  input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    z-index: -1;
  }

  .microphone-check {
    display: inline-flex;
    display: -webkit-inline-flex;
    align-items: center;
    -webkit-align-items: center;
    width: 6em;
    height: 3em;
    background: #3996d4;
    border-radius: 50px;
    transition: all 0.6s ease;
    -webkit-transition: all 0.6s ease;
    cursor: pointer;
    box-shadow: inset 2px 2px 8px 0 rgba(0, 0, 0, 0.35),
      inset -3px -3px 8px 0 rgba(155, 196, 242, 0.5),
    6px 6px 18px 0 rgba(0, 0, 0, 0), -6px -6px 18px 0 rgba(155, 196, 242, 0);
    -webkit-box-shadow: inset 2px 2px 8px 0 rgba(0, 0, 0, 0.35),
      inset -3px -3px 8px 0 rgba(155, 196, 242, 0.5),
    6px 6px 18px 0 rgba(0, 0, 0, 0), -6px -6px 18px 0 rgba(155, 196, 242, 0);
  }

  .microphone-icon {
    display: flex;
    display: -webkit-flex;
    justify-content: center;
    -webkit-justify-content: center;
    align-items: center;
    -webkit-align-items: center;
    margin-left: 0.2em;
    width: 2.8em;
    height: 2.8em;
    border-radius: 50%;
    transition: all 0.6s ease;
    -webkit-transition: all 0.6s ease;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.4);
    -webkit-box-shadow: 0 0 8px rgba(0, 0, 0, 0.4);
  }

  .microphone-icon:before {
    content: "\\f130";
    color: #fff;
    font-size: 1rem;
    font-family: "Font Awesome 5 Free",serif;
    font-weight: 900;
  }

  input[type="checkbox"]:checked + .microphone-check {
    background: #e34c38;
  }

  input[type="checkbox"]:checked + .microphone-check .microphone-icon {
    margin-left: 3em;
    background: #e34c38;
    transform: rotate(360deg);
    -webkit-transform: rotate(360deg);
  }

  input[type="checkbox"]:checked + .microphone-check .microphone-icon::before {
    content: "\\f131";
  }
`

const SelectButton = styled.div`
  pointer-events: auto;
  z-index: 99;
  label {
    background: #3996d4;
    border: none;
    border-radius: 5px;
    color: #fff;
    cursor: pointer;
    display: inline-block;
    font-size: 1.1rem;
    font-weight: 500;
    outline: none;
    padding: 1rem 20px;
    position: relative;
    transition: all 0.3s;
    vertical-align: middle;

    :hover {
      filter: brightness(70%); !important;
    }
    
    input {
      height: 0;
      overflow: hidden;
      width: 0;
    }
  }
`

const AudioPlayer = styled.audio`
  pointer-events: visible;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
`

const Divider = styled.div`
  width: 100%;
  height: 3px;
  background: black;
  border-radius: 4px;
  border: black solid 1px;
`

const SingleRow = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 20px;
`

export const UserInterface = observer(() => {
  const store = useContext(ProjectStoreContext)!;
  const audioRef = useRef(null);

  return (
    <InterfaceWrapper>
      <ResizableDashBoard>
        <SingleRow style={{justifyContent: "space-between", alignItems: "baseline", flexWrap: "nowrap", gap: "40px"}}>
        <SelectButton>
          <label form={'audioFile'}> Choose an audio file
            <input onChange={(e) => {
              store.loadAudio(audioRef, e.target.files[0])
            }}
                   type={'file'}
                   id={'audioFile'}
                   accept={'audio/*'} />
          </label>
        </SelectButton>
        <ToggleButton>
          <input id="microphone" type="checkbox" defaultChecked={true} onChange={(e) => {
            store.toggleMic();
          }}/>
          <label htmlFor="microphone" className="microphone-check">
            <span className="microphone-icon"></span>
          </label>
        </ToggleButton>
        </SingleRow>
        <EffectTitle style={{verticalAlign: "middle"}}>Choose Visualization:</EffectTitle>
        <SingleRow style={{width: "100%"}}>
          <Dropdown data={store.visualizations} initialState={store.selectedVisualization} callback={(id:number) => store.setVisualization(id)}/>
        </SingleRow>
        <Divider/>
        <EffectTitle>Play Notes:</EffectTitle>
        <NoteGroup/>
      </ResizableDashBoard>
      <AudioPlayer ref={audioRef} id={'audioPlayer'} controls={true} />
    </InterfaceWrapper>
  )
});

const notes = ["C2", "D2", "E2", "G2", "A2", "B2",
  "C3", "D3", "E3", "G3", "A3", "B3",
  "C4", "D4", "E4", "G4", "A4", "B4",
  "C5", "D5", "E5", "G5", "A5", "B5",
  "C6", "D6", "E6", "G6", "A6", "B6"];

const NoteGroup = () => {
  const store = useContext(ProjectStoreContext)!;
  return <div style={{display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'space-between'}}>
    { notes.map((item, index) =>
        <SelectButton key={index}>
          <label form={`note-${item}`}> {item}
            <input onClick={(e) => {
              store.triggerNote(item);
            }}
                   type={'button'}
                   id={`note-${item}`}
                   style={{ 'display': 'none' }}
            />
          </label>
        </SelectButton>
      )
    }
  </div>
}

const EffectTitle = styled.h2`
  font-size: 1.2rem;
  margin: 0;
  padding: 0;
`

const Knob = styled.div`
  justify-self: start;
  position: relative;
  width: 90px;
  padding: 7px 10px;
  border-radius: 6px;
  background-color: #2c2d2f;
  color: #f4f4f4;
  box-shadow: 0 3px 6px rgba(0,0,0,0.2);
  z-index: 99;
  
  .__container {
    display: block;
    overflow: hidden;
    position: relative;
    height: 70px;
    width: 70px;
  }
  .__svg {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    height: 70px;
    width: 70px;    
    
    path {
      stroke-linecap: round;
      stroke-width: 6;
      fill: none;      
    }
  }
  .__dial {
    position: absolute;
    text-align: center;
    height: 48px;
    width: 48px;
    top: 50%;
    left: 50%;
    border: 6px solid #181b1c;
    border-radius: 100%;
    box-sizing: border-box;
    transform: translate(-50%, -50%);   
    
    ::after {
      content: "";
      position: absolute;
      top: 6px;
      height: 8px;
      width: 2px;
      background-color: #f4f4f4;      
    }
  }
  .__val {
    text-align: center;
    color: #fff;
    text-shadow: #21CD92 1px 0 10px;
    font-family: "Roboto Light", sans-serif;
  }
`

interface AudioEffectProps {
  maxValue: number,
  initialValue: number,
  label: string,
  onUpdate: (a:number) => void
}

export const AudioEffect = observer((props:AudioEffectProps) => {
  const [value, setValue] = useState(props.initialValue);
  const [prevVal, setPrevVal] = useState(0);

  const updateValue = (deltaY:number) => {
    let newValue = value + deltaY;
    if (newValue > props.maxValue) { newValue = props.maxValue; }
    else if (newValue < 0) { newValue = 0; }
    setValue(newValue);
    props.onUpdate && props.onUpdate(newValue);
  }

  useEffect(() => {
    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const handleWheel = (e:any) => {
    updateValue(e.deltaY);
    setPrevVal(e.deltaY);
  }

  const getRotation = (val:number) => {
    return 184 - (184 / props.maxValue)*(val);
  }

  return (
    <Knob>
      <div className={`__val`}>
        {props.label}
      </div>
      <div className={"__container"} onWheel={handleWheel}>
        <svg className={"__svg"} viewBox={"0 0 100 100"}>
          <path
            d={"M20,76 A 40 40 0 1 1 80 76"}
            stroke={"#55595C"}
          />
          <path
            d={'M20,76 A 40 40 0 1 1 80 76'}
            stroke={"#21CD92"}
            strokeDasharray={184}
            style={{
              strokeDashoffset: getRotation(value),
              transition: '0.3s cubic-bezier(0, 0, 0.24, 1)'
            }}
          />
        </svg>
        <div
          className={`__dial`}
          style={{transform: `translate(-50%,-50%) rotate(${mapLinear(value, 0, props.maxValue, -120, 120)}deg)`}}
        />
      </div>
      <div className={`__val`}>
        {value}
      </div>
    </Knob>
  )
});

export const ResizableDashBoard:React.FC = (props) => {
  const [width, setWidth] = useState(0.3 * window.innerWidth);
  const barRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = React.useCallback((mouseDownEvent) => {
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (mouseMoveEvent) => {
      if (isResizing) {
        setWidth(
          barRef.current.getBoundingClientRect().right -
          mouseMoveEvent.clientX
        );
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <Dashboard style={{width: width}} ref={barRef} onMouseDown={event => event.preventDefault()}>
      <Resizer onMouseDown={startResizing}/>
      <DashboardContent>{props.children}</DashboardContent>
    </Dashboard>
  );
}

const Resizer = styled.div`
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: 6px;
  justify-self: flex-start;
  cursor: col-resize;
  resize: horizontal;
  
  :hover {
    width: 3px;
    background: #c1c3c5b4;
  }
`

const ToggleWrapper = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 30px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #2c3e50;
    transition: 0.3s;
    border-radius: 30px;
  }
  span:before {
    position: absolute;
    content: "";
    height: 25px;
    width: 25px;
    left: 3px;
    bottom: 2.6px;
    background-color: #fff;
    border-radius: 50%;
    transition: 0.3s;
  }

  input:checked + span {
    background-color: #00c853;
  }

  input:checked + span:before {
    transform: translateX(29px);
  }
`