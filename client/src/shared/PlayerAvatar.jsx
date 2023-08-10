import { PropTypes } from 'prop-types';
import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { thumbs } from '@dicebear/collection';
import { Avatar } from 'rsuite';

function PlayerAvatar({ playerName, sizeInPixels = 60 }) {
  PlayerAvatar.propTypes = {
    playerName: PropTypes.string.isRequired,
    sizeInPixels: PropTypes.number,
  };

  const avatar = useMemo(() => {
    return createAvatar(thumbs, {
      size: sizeInPixels,
      seed: playerName,
    }).toDataUriSync();
  }, [playerName, sizeInPixels]);

  return (
    <Avatar size="lg">
      <img
        src={avatar}
        style={{ width: `${sizeInPixels}px`, height: `${sizeInPixels}px` }}
      ></img>
    </Avatar>
  );
}

export default PlayerAvatar;
