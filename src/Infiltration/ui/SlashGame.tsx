import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import { IMinigameProps } from "./IMinigameProps";
import { KeyHandler } from "./KeyHandler";
import { GameTimer } from "./GameTimer";
import { interpolate } from "./Difficulty";
import Typography from "@mui/material/Typography";

interface Difficulty {
  [key: string]: number;
  window: number;
}

const difficulties: {
  Trivial: Difficulty;
  Normal: Difficulty;
  Hard: Difficulty;
  Impossible: Difficulty;
} = {
  Trivial: { window: 600 },
  Normal: { window: 325 },
  Hard: { window: 250 },
  Impossible: { window: 150 },
};

export function SlashGame(props: IMinigameProps): React.ReactElement {
  const difficulty: Difficulty = { window: 0 };
  interpolate(difficulties, props.difficulty, difficulty);
  const [guarding, setGuarding] = useState(true);

  function press(this: Document, event: KeyboardEvent): void {
    event.preventDefault();
    if (event.keyCode !== 32) return;
    if (guarding) {
      props.onFailure();
    } else {
      props.onSuccess();
    }
  }

  useEffect(() => {
    let id2 = -1;
    const id = window.setTimeout(() => {
      setGuarding(false);
      id2 = window.setTimeout(() => setGuarding(true), difficulty.window);
    }, Math.random() * 3250 + 1500);
    return () => {
      clearInterval(id);
      if (id2 !== -1) clearInterval(id2);
    };
  }, []);

  return (
    <Grid container spacing={3}>
      <GameTimer millis={5000} onExpire={props.onFailure} />
      <Grid item xs={12}>
        <Typography variant="h4">Slash when his guard is down!</Typography>
        <Typography variant="h4">{guarding ? "!Guarding!" : "!ATTACKING!"}</Typography>
        <KeyHandler onKeyDown={press} onFailure={props.onFailure} />
      </Grid>
    </Grid>
  );
}
