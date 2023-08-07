import { PropTypes } from 'prop-types';
import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { thumbs } from '@dicebear/collection';
import { Avatar } from 'rsuite';

function PlayerAvatar({ playerName }) {
  PlayerAvatar.propTypes = {
    playerName: PropTypes.string.isRequired,
  };

  const avatar = useMemo(() => {
    return createAvatar(thumbs, {
      size: 60,
      seed: playerName,
    }).toDataUriSync();
  }, [playerName]);

  return (
    <Avatar size="lg">
      <img src={avatar}></img>
    </Avatar>
  );
}

export default PlayerAvatar;
