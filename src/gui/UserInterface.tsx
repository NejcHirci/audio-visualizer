import * as React from "react";
import styled from "styled-components";
import {useCallback, useRef} from "react";

const InterfaceWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  position: absolute;
  top: 1rem;
  left: 1rem;
`

export const UserInterface = () => {
    const audioRef = useRef(null);

    return (
        <InterfaceWrapper>
            <label form={"audioFile"}> Choose an audio file:
                <input onChange={(e) => {audioRef}}
                       type={"file"}
                       id={"audioFile"}
                       accept={"audio/*"}/>
            </label>

            <audio ref={audioRef} id={"audioPlayer"} controls={true}/>
        </InterfaceWrapper>
    );
}