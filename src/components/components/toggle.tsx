import { useState } from 'react'
import * as React from 'react'
import styled from 'styled-components'
import value from '*.glsl'
import { observer } from 'mobx-react-lite'



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

interface ToggleProps {
  label: string
  toggled: boolean
  onClick: () => void
}

export const ToggleButton = observer(({label, toggled, onClick}:ToggleProps) => {
  return (
    <ToggleWrapper>
      <input type={"checkbox"} checked={toggled} onChange={onClick}/>
      <span />
      <strong>{label}</strong>
    </ToggleWrapper>
  );
});