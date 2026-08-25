import React, { useState, useRef, useMemo } from 'react';
import { useStore } from '../../shared/context/StoreContext';
import Icon from '../../shared/components/Icons';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import './Supermarket.css';

// 3D Aisle Component
const Aisle = ({ position, category, status, alertCount, isSelected, onClick }) => {
  const meshRef = useRef();
  const [hovered, setHover] = useState(false);

  // Animation for critical status (pulsing effect)
  useFrame((state) => {
    if (status === 'critical' && meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.05;
      meshRef.current.scale.set(scale, scale, scale);
    } else if (meshRef.current) {
      // Lerp back to normal scale
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  // Colors based on theme and status
  const baseColor = isSelected ? category.color : (hovered ? '#4f46e5' : '#1e293b');
  const emissiveColor = status === 'critical' ? '#ef4444' : (status === 'warning' ? '#f59e0b' : '#000000');
  const emissiveIntensity = status !== 'ok' ? 0.6 : 0;

  return (
    <group position={position}>
      {/* HTML Overlay for labels */}
      <Html position={[0, 1.8, 0]} center style={{ pointerEvents: 'none' }}>
        <div className={`aisle-3d-label ${isSelected ? 'selected' : ''}`}>
          <div className="aisle-icon" style={{ backgroundColor: category.color }}>
            {category.name.charAt(0)}
          </div>
          <span className="aisle-name-text">{category.name}</span>
          {alertCount > 0 && (
            <div className="aisle-badge badge-err anim-pop">{alertCount}</div>
          )}
        </div>
      </Html>

      {/* The Shelf Geometry */}
      <RoundedBox
        ref={meshRef}
        args={[2, 2.5, 1]} // width, height, depth
        radius={0.1}
        smoothness={4}
        onClick={(e) => {
          e.stopPropagation();
          onClick(category.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          setHover(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <meshStandardMaterial 
          color={baseColor} 
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.7}
          metalness={0.2}
        />
      </RoundedBox>
    </group>
  );
};

const Supermarket = () => {
  const { categories, products, alerts } = useStore();
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categoryAlerts = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.id] = alerts.filter(a => a.categoryId === cat.id || a.category === cat.name);
      return acc;
    }, {});
  }, [categories, alerts]);

  const getHealthStatus = (catId) => {
    const catAlerts = categoryAlerts[catId] || [];
    if (catAlerts.length === 0) return 'ok';
    if (catAlerts.some(a => a.severity === 'critical')) return 'critical';
    return 'warning';
  };

  const selectedCatData = selectedCategory ? categories.find(c => c.id === selectedCategory) : null;
  const selectedCatProducts = selectedCategory ? products.filter(p => p.category === selectedCategory || p.categoryId === selectedCategory) : [];

  // Calculate layout for aisles (2 rows of 4)
  const aislePositions = useMemo(() => {
    const positions = [];
    const rows = 2;
    const cols = Math.ceil(categories.length / rows);
    const spacingX = 3.5;
    const spacingZ = 4;

    categories.forEach((_, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const x = (col - (cols - 1) / 2) * spacingX;
      const z = (row - (rows - 1) / 2) * spacingZ;
      positions.push([x, 1.25, z]); // y is half of height (2.5) to sit on floor
    });
    return positions;
  }, [categories]);

  return (
    <div className="supermarket-page anim-slide-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Vista del Supermercado (3D)</h1>
          <p className="page-subtitle">Mapa interactivo con rotación limitada. Haz clic en un pasillo.</p>
        </div>
        <div className="badge badge-err" style={{ fontSize: 'var(--fs-base)', padding: 'var(--sp-2) var(--sp-4)' }}>
          <Icon name="bell" size={18} />
          {alerts.length} Alertas
        </div>
      </header>

      <div className="sm-layout">
        <div className="sm-floor-plan-3d card">
          <Canvas 
            camera={{ position: [0, 8, 12], fov: 45 }}
            shadows
          >
            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <directionalLight 
              position={[10, 15, 10]} 
              intensity={1} 
              castShadow 
              shadow-mapSize={[1024, 1024]}
            />
            <pointLight position={[-10, -10, -10]} intensity={0.2} />

            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow onClick={() => setSelectedCategory(null)}>
              <planeGeometry args={[30, 30]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>

            {/* Grid Helper for aesthetics */}
            <gridHelper args={[30, 30, '#1e293b', '#1e293b']} position={[0, 0.01, 0]} />

            {/* Aisles */}
            {categories.map((cat, idx) => (
              <Aisle
                key={cat.id}
                position={aislePositions[idx]}
                category={cat}
                status={getHealthStatus(cat.id)}
                alertCount={(categoryAlerts[cat.id] || []).length}
                isSelected={selectedCategory === cat.id}
                onClick={setSelectedCategory}
              />
            ))}

            {/* Controls: Limited rotation to prevent losing the map */}
            <OrbitControls 
              makeDefault
              minPolarAngle={Math.PI / 6} // Don't go below 30deg
              maxPolarAngle={Math.PI / 2.2} // Don't go below ground
              minAzimuthAngle={-Math.PI / 4} // Limit horizontal rotation left
              maxAzimuthAngle={Math.PI / 4} // Limit horizontal rotation right
              minDistance={5}
              maxDistance={25}
              enablePan={false}
            />
          </Canvas>
          <div className="sm-3d-hint">
            <Icon name="layers" size={16} />
            Arrastra para rotar. Rueda del ratón para hacer zoom.
          </div>
        </div>

        <div className="sm-side-panel card">
          {!selectedCategory ? (
            <div className="all-alerts-panel anim-slide-in">
              <h2 className="panel-title">
                <Icon name="alert-triangle" size={20} />
                Alertas Globales
              </h2>
              <div className="alerts-list">
                {alerts.length === 0 ? (
                  <p className="text-muted text-center py-6">Todo en orden. No hay alertas.</p>
                ) : (
                  alerts.map((alert, idx) => (
                    <div key={alert.id || idx} className="alert-item">
                      <div className="alert-header">
                        <span className="alert-pname">{alert.name}</span>
                        <span className={`badge badge-${alert.severity === 'critical' ? 'err' : (alert.severity === 'warning' ? 'warn' : 'info')}`}>
                          {alert.severity === 'critical' ? 'Sin Stock' : (alert.severity === 'warning' ? 'Bajo' : 'Aviso')}
                        </span>
                      </div>
                      <div className="alert-meta">
                        <span>{alert.categoryName || alert.category}</span>
                        <span>Stock: {alert.stock} / {alert.minStock}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="category-detail-panel anim-slide-in">
              <div className="panel-header">
                <button className="btn btn-icon btn-ghost" onClick={() => setSelectedCategory(null)}>
                  <Icon name="chevron-left" size={20} />
                </button>
                <h2 className="panel-title">{selectedCatData?.name}</h2>
              </div>
              <div className="cat-products-list">
                {selectedCatProducts.length === 0 ? (
                  <p className="text-muted">No hay productos aquí.</p>
                ) : (
                  selectedCatProducts.map(p => {
                    const isAlert = p.stock <= p.minStock;
                    const isCrit = p.stock === 0;
                    return (
                      <div key={p.id} className={`cat-prod-item ${isAlert ? (isCrit ? 'alert-crit' : 'alert-warn') : ''}`}>
                        <div className="cp-details">
                          <span className="cp-name">{p.name}</span>
                          <span className="cp-price">${p.price.toFixed(2)}</span>
                        </div>
                        <div className="cp-stock">
                          Stock: <strong>{p.stock}</strong>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Supermarket;
