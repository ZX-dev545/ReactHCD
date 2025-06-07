import React from 'react';
import { useNavigate } from 'react-router-dom';
import InitialPageSvg from '../assets/svg/initial-page.svg';


const InitialPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate('/signin-page')}
            style={{
                width: '100vw',
                height: '100vh',
                cursor: 'pointer',
                overflow: 'hidden',
            }}
        >
            <InitialPageSvg
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid slice"
            />
        </div>
    );
};

export default InitialPage;